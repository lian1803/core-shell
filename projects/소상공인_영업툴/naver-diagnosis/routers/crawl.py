"""
크롤링 라우터
POST /crawl/start: 크롤링 시작 (백그라운드)
GET /crawl/status/{job_id}: 크롤링 상태 조회
"""
import uuid
import asyncio
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Request, BackgroundTasks, Depends
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database import get_db, async_session_maker
from models import CrawlJob, DiagnosisHistory
from services.naver_place_crawler import NaverPlaceCrawler
from services.naver_search_ad import NaverSearchAdAPI
from services.scorer import DiagnosisScorer
from services.ppt_generator import PPTGenerator
from browser_manager import get_browser

router = APIRouter(prefix="/crawl", tags=["crawl"])

# 동시 크롤링 최대 3개 제한 (메모리 보호)
_crawl_semaphore = asyncio.Semaphore(3)


class CrawlStartRequest(BaseModel):
    """크롤링 시작 요청"""
    place_id: str = Field(..., description="네이버 플레이스 ID")
    business_name: str = Field(..., description="업체명")
    address: Optional[str] = Field(None, description="주소")
    category: Optional[str] = Field(None, description="업종")
    keywords: Optional[List[str]] = Field(default=[], description="분석할 키워드 목록")


class CrawlStartResponse(BaseModel):
    """크롤링 시작 응답"""
    success: bool
    job_id: str
    message: str


class CrawlStatusResponse(BaseModel):
    """크롤링 상태 응답"""
    job_id: str
    status: str
    progress: int
    result_id: Optional[int]
    error_message: Optional[str]


async def run_crawl_job(
    job_id: str,
    place_id: str,
    business_name: str,
    address: Optional[str],
    category: Optional[str],
    keywords: List[str],
    browser,
):
    """
    백그라운드 크롤링 작업 실행

    상태 진행:
    - pending -> searching (20%)
    - searching -> crawling (50%)
    - crawling -> analyzing (75%)
    - analyzing -> generating (90%)
    - generating -> done (100%)
    """
    async with _crawl_semaphore:
        async with async_session_maker() as db:
            try:
                # 1. searching: 검색 단계
                job = await db.get(CrawlJob, job_id)
                if not job:
                    return

                job.status = "searching"
                job.progress = 20
                await db.commit()

                crawler = NaverPlaceCrawler(browser)

                # place_id 없으면 업체명으로 자동 검색
                if not place_id:
                    place_id = await crawler.find_place_id(business_name)

                # 2. crawling: Playwright 크롤링
                job.status = "crawling"
                job.progress = 50
                await db.commit()

                # place_id가 있으면 상세 페이지, 없으면 검색 결과에서 직접 추출
                if place_id:
                    crawl_result = await crawler.crawl_place_detail(place_id)
                else:
                    # 검색 결과 페이지에서 직접 데이터 추출
                    crawl_result = await crawler.crawl_from_search(business_name)

                # 데이터가 모두 0이면 검색 결과에서 다시 시도
                if (crawl_result.get("photo_count", 0) == 0 and
                    crawl_result.get("visitor_review_count", 0) == 0 and
                    crawl_result.get("blog_review_count", 0) == 0):
                    print(f"[Crawl] 상세 페이지 데이터 없음, 검색 결과에서 재시도")
                    crawl_result = await crawler.crawl_from_search(business_name)

                # 3. analyzing: 점수 계산
                job.status = "analyzing"
                job.progress = 75
                await db.commit()

                # 데이터 정리
                diagnosis_data = {
                    "business_name": business_name,
                    "place_id": place_id,
                    "address": address,
                    "category": category,
                    "place_url": crawl_result.get("place_url"),
                    "photo_count": crawl_result.get("photo_count", 0),
                    "review_count": (
                        crawl_result.get("receipt_review_count", 0) +
                        crawl_result.get("visitor_review_count", 0)
                    ),
                    "blog_review_count": crawl_result.get("blog_review_count", 0),
                    "has_menu": crawl_result.get("has_menu", False),
                    "has_hours": crawl_result.get("has_hours", False),
                    "has_price": crawl_result.get("has_price", False),
                    "keywords": crawl_result.get("keywords", []),
                    # 확장 필드
                    "has_intro": crawl_result.get("has_intro", False),
                    "intro_text_length": crawl_result.get("intro_text_length", 0),
                    "has_directions": crawl_result.get("has_directions", False),
                    "directions_text_length": crawl_result.get("directions_text_length", 0),
                    "has_booking": crawl_result.get("has_booking", False),
                    "has_talktalk": crawl_result.get("has_talktalk", False),
                    "has_smartcall": crawl_result.get("has_smartcall", False),
                    "has_coupon": crawl_result.get("has_coupon", False),
                    "has_news": crawl_result.get("has_news", False),
                    "menu_count": crawl_result.get("menu_count", 0),
                    "has_menu_description": crawl_result.get("has_menu_description", False),
                    "receipt_review_count": crawl_result.get("receipt_review_count", 0),
                    "visitor_review_count": crawl_result.get("visitor_review_count", 0),
                    "has_owner_reply": crawl_result.get("has_owner_reply", False),
                    "has_instagram": crawl_result.get("has_instagram", False),
                    "has_kakao": crawl_result.get("has_kakao", False),
                    "naver_place_rank": 0,
                    "related_keywords": [],
                }

                # 연관 키워드 및 순위 조회
                if diagnosis_data["keywords"] and len(diagnosis_data["keywords"]) > 0:
                    first_kw = diagnosis_data["keywords"][0] if isinstance(diagnosis_data["keywords"][0], str) else diagnosis_data["keywords"][0].get("keyword", "")
                    if first_kw and business_name:
                        try:
                            related = await crawler.get_related_keywords(first_kw or business_name)
                            diagnosis_data["related_keywords"] = related

                            # 순위 조회
                            if place_id:
                                rank = await crawler.get_place_rank(first_kw, place_id)
                                diagnosis_data["naver_place_rank"] = rank
                        except Exception as e:
                            print(f"[Crawl] 연관 키워드/순위 조회 오류: {e}")

                # 점수 계산
                scores = DiagnosisScorer.calculate_all(diagnosis_data)
                diagnosis_data.update(scores)

                # 4. generating: PPT 생성
                job.status = "generating"
                job.progress = 90
                await db.commit()

                ppt_gen = PPTGenerator(output_dir="ppt_output")
                ppt_filename = ppt_gen.generate(diagnosis_data)
                diagnosis_data["ppt_filename"] = ppt_filename

                # DiagnosisHistory 저장
                history = DiagnosisHistory(
                    business_name=diagnosis_data["business_name"],
                    place_id=diagnosis_data["place_id"],
                    address=diagnosis_data.get("address"),
                    category=diagnosis_data.get("category"),
                    place_url=diagnosis_data.get("place_url"),
                    photo_count=diagnosis_data["photo_count"],
                    review_count=diagnosis_data["review_count"],
                    blog_review_count=diagnosis_data["blog_review_count"],
                    has_menu=diagnosis_data["has_menu"],
                    has_hours=diagnosis_data["has_hours"],
                    has_price=diagnosis_data["has_price"],
                    keywords=diagnosis_data["keywords"],
                    # 확장 필드
                    has_intro=diagnosis_data.get("has_intro", False),
                    intro_text_length=diagnosis_data.get("intro_text_length", 0),
                    has_directions=diagnosis_data.get("has_directions", False),
                    directions_text_length=diagnosis_data.get("directions_text_length", 0),
                    has_booking=diagnosis_data.get("has_booking", False),
                    has_talktalk=diagnosis_data.get("has_talktalk", False),
                    has_smartcall=diagnosis_data.get("has_smartcall", False),
                    has_coupon=diagnosis_data.get("has_coupon", False),
                    has_news=diagnosis_data.get("has_news", False),
                    menu_count=diagnosis_data.get("menu_count", 0),
                    has_menu_description=diagnosis_data.get("has_menu_description", False),
                    receipt_review_count=diagnosis_data.get("receipt_review_count", 0),
                    visitor_review_count=diagnosis_data.get("visitor_review_count", 0),
                    has_owner_reply=diagnosis_data.get("has_owner_reply", False),
                    has_instagram=diagnosis_data.get("has_instagram", False),
                    has_kakao=diagnosis_data.get("has_kakao", False),
                    naver_place_rank=diagnosis_data.get("naver_place_rank", 0),
                    related_keywords=diagnosis_data.get("related_keywords", []),
                    # 점수
                    photo_score=diagnosis_data["photo_score"],
                    review_score=diagnosis_data["review_score"],
                    blog_score=diagnosis_data["blog_score"],
                    keyword_score=diagnosis_data["keyword_score"],
                    info_score=diagnosis_data["info_score"],
                    convenience_score=diagnosis_data.get("convenience_score", 0.0),
                    engagement_score=diagnosis_data.get("engagement_score", 0.0),
                    total_score=diagnosis_data["total_score"],
                    grade=diagnosis_data["grade"],
                    improvement_points=diagnosis_data["improvement_points"],
                    ppt_filename=ppt_filename,
                    is_manual=False,
                )
                db.add(history)
                await db.commit()
                await db.refresh(history)

                # 5. done: 완료
                job.status = "done"
                job.progress = 100
                job.result_id = history.id
                await db.commit()

            except Exception as e:
                # 실패 처리
                job = await db.get(CrawlJob, job_id)
                if job:
                    job.status = "failed"
                    job.error_message = str(e)
                    await db.commit()


@router.post("/start", response_model=CrawlStartResponse)
async def start_crawl(
    request: Request,
    body: CrawlStartRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """
    크롤링 시작 (백그라운드 실행)

    1. CrawlJob 생성
    2. 백그라운드 태스크로 크롤링 실행
    3. job_id 반환
    """
    try:
        browser = await get_browser(request.app)
        if not browser:
            raise HTTPException(status_code=503, detail="브라우저가 초기화되지 않았습니다")

        # CrawlJob 생성
        job_id = str(uuid.uuid4())
        job = CrawlJob(
            id=job_id,
            status="pending",
            progress=0,
        )
        db.add(job)
        await db.commit()

        # 백그라운드 태스크 등록
        background_tasks.add_task(
            run_crawl_job,
            job_id=job_id,
            place_id=body.place_id,
            business_name=body.business_name,
            address=body.address,
            category=body.category,
            keywords=body.keywords or [],
            browser=browser,
        )

        return CrawlStartResponse(
            success=True,
            job_id=job_id,
            message="크롤링이 시작되었습니다. job_id로 상태를 확인하세요."
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"크롤링 시작 실패: {str(e)}")


@router.get("/status/{job_id}", response_model=CrawlStatusResponse)
async def get_crawl_status(
    job_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    크롤링 작업 상태 조회

    상태 종류:
    - pending: 대기 중
    - searching: 검색 중
    - crawling: 크롤링 중
    - analyzing: 분석 중
    - generating: PPT 생성 중
    - done: 완료
    - failed: 실패
    """
    try:
        job = await db.get(CrawlJob, job_id)

        if not job:
            raise HTTPException(status_code=404, detail="작업을 찾을 수 없습니다")

        return CrawlStatusResponse(
            job_id=job.id,
            status=job.status,
            progress=job.progress,
            result_id=job.result_id,
            error_message=job.error_message,
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"상태 조회 실패: {str(e)}")
