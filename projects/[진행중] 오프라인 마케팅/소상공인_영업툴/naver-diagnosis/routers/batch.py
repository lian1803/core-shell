"""
배치 처리 라우터
POST /batch/start          — 배치 진단 시작 (파일 경로 지정)
GET  /batch/status/{batch_id} — 배치 진행 상태 조회
POST /batch/cancel/{batch_id} — 배치 취소
GET  /batch/list           — 전체 배치 목록
"""
import asyncio
from fastapi import APIRouter, HTTPException, BackgroundTasks, Request
from pydantic import BaseModel

from services.batch_processor import (
    create_batch_job,
    run_batch,
    get_batch_status,
    list_batch_jobs,
    cancel_batch,
    OPENPYXL_AVAILABLE,
)

router = APIRouter(prefix="/batch", tags=["batch"])


class BatchStartRequest(BaseModel):
    file_path: str  # xlsx 절대 경로


async def _crawl_callback_factory(app_state):
    """
    배치에서 호출할 크롤링 콜백 생성 팩토리.
    app.state.browser에서 브라우저 가져옴.
    """
    async def _do_crawl(business_name: str):
        """단건 크롤링 → history_id 반환."""
        try:
            from database import async_session_maker
            from models import DiagnosisHistory, CrawlJob
            from services.naver_place_crawler import NaverPlaceCrawler
            from services.scorer import DiagnosisScorer
            from services.ppt_generator import PPTGenerator
            from services.message_generator import generate_all_messages
            import uuid

            browser = app_state.browser
            if not browser:
                return None

            crawler = NaverPlaceCrawler(browser)

            # place_id 찾기
            place_id = await crawler.find_place_id(business_name)
            if not place_id:
                return None

            # 상세 크롤링
            crawl_data = await crawler.crawl_place(place_id, business_name)
            if not crawl_data:
                return None

            # 점수 계산
            scores = DiagnosisScorer.calculate_all(crawl_data)
            crawl_data.update(scores)

            # 경쟁사 데이터 (배치에서는 폴백 사용, 속도 우선)
            from config.industry_weights import get_competitor_fallback
            fb = get_competitor_fallback(crawl_data.get("category", ""))
            crawl_data["competitor_avg_review"] = fb["avg_review"]
            crawl_data["competitor_avg_photo"] = fb["avg_photo"]
            crawl_data["competitor_avg_blog"] = fb["avg_blog"]
            crawl_data["estimated_lost_customers"] = 0

            # 메시지 생성
            messages = generate_all_messages(crawl_data)

            # 우선순위 자동 분류
            from services.scorer import DiagnosisScorer as S
            priority_tag = _auto_priority(crawl_data)

            # PPT 생성
            ppt_gen = PPTGenerator(output_dir="ppt_output")
            ppt_filename = ppt_gen.generate(crawl_data)

            # DB 저장
            async with async_session_maker() as db:
                history = DiagnosisHistory(
                    business_name=crawl_data.get("business_name", business_name),
                    place_id=place_id,
                    address=crawl_data.get("address"),
                    category=crawl_data.get("category"),
                    place_url=crawl_data.get("place_url"),
                    photo_count=crawl_data.get("photo_count", 0),
                    review_count=crawl_data.get("review_count", 0),
                    blog_review_count=crawl_data.get("blog_review_count", 0),
                    has_menu=crawl_data.get("has_menu", False),
                    has_hours=crawl_data.get("has_hours", False),
                    has_price=crawl_data.get("has_price", False),
                    has_booking=crawl_data.get("has_booking", False),
                    has_talktalk=crawl_data.get("has_talktalk", False),
                    has_smartcall=crawl_data.get("has_smartcall", False),
                    has_coupon=crawl_data.get("has_coupon", False),
                    has_news=crawl_data.get("has_news", False),
                    has_intro=crawl_data.get("has_intro", False),
                    has_directions=crawl_data.get("has_directions", False),
                    has_menu_description=crawl_data.get("has_menu_description", False),
                    has_owner_reply=crawl_data.get("has_owner_reply", False),
                    has_instagram=crawl_data.get("has_instagram", False),
                    has_kakao=crawl_data.get("has_kakao", False),
                    keywords=crawl_data.get("keywords", []),
                    naver_place_rank=crawl_data.get("naver_place_rank", 0),
                    related_keywords=crawl_data.get("related_keywords", []),
                    menu_count=crawl_data.get("menu_count", 0),
                    receipt_review_count=crawl_data.get("receipt_review_count", 0),
                    visitor_review_count=crawl_data.get("visitor_review_count", 0),
                    photo_score=scores.get("photo_score", 0),
                    review_score=scores.get("review_score", 0),
                    blog_score=scores.get("blog_score", 0),
                    keyword_score=scores.get("keyword_score", 0),
                    info_score=scores.get("info_score", 0),
                    convenience_score=scores.get("convenience_score", 0),
                    engagement_score=scores.get("engagement_score", 0),
                    total_score=scores.get("total_score", 0),
                    grade=scores.get("grade", "D"),
                    improvement_points=scores.get("improvement_points", []),
                    ppt_filename=ppt_filename,
                    is_manual=False,
                    # 신규 필드
                    industry_type=crawl_data.get("industry_type", ""),
                    priority_tag=priority_tag,
                    competitor_avg_review=fb["avg_review"],
                    competitor_avg_photo=fb["avg_photo"],
                    competitor_avg_blog=fb["avg_blog"],
                    estimated_lost_customers=crawl_data.get("estimated_lost_customers", 0),
                    messages=messages,
                )
                db.add(history)
                await db.commit()
                await db.refresh(history)
                return history.id

        except Exception as e:
            print(f"[Batch] 크롤링 콜백 오류 ({business_name}): {e}")
            return None

    return _do_crawl


def _auto_priority(data: dict) -> str:
    """
    영업 우선순위 자동 분류.
    1순위: D등급 + (사진<10 OR 리뷰<10 OR 순위>10 OR 블로그<5) 중 2개 이상
    2순위: C등급 + 경쟁사 대비 절반 미만
    패스: A등급
    """
    grade = data.get("grade", "D")
    photo = data.get("photo_count", 0)
    review = data.get("review_count", 0)
    rank = data.get("naver_place_rank", 0)
    blog = data.get("blog_review_count", 0)
    competitor_avg_review = data.get("competitor_avg_review", 0)

    if grade == "A":
        return "패스"

    if grade == "D":
        weak_count = sum([
            photo < 10,
            review < 10,
            (rank > 10 if rank > 0 else False),
            blog < 5,
        ])
        if weak_count >= 2:
            return "1순위"

    if grade in ("C", "D"):
        if competitor_avg_review > 0 and review < (competitor_avg_review / 2):
            return "1순위"
        return "2순위"

    return "2순위"


@router.post("/start")
async def start_batch(
    body: BatchStartRequest,
    background_tasks: BackgroundTasks,
    request: Request,
):
    """
    xlsx 파일 경로로 배치 진단 시작.
    업체명 컬럼 자동 감지 → 순차 진단 (배치 간 3초 딜레이).
    """
    if not OPENPYXL_AVAILABLE:
        raise HTTPException(
            status_code=500,
            detail="openpyxl 패키지가 설치되어 있지 않습니다. pip install openpyxl"
        )

    try:
        job = create_batch_job(body.file_path)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"배치 준비 실패: {str(e)}")

    batch_id = job["batch_id"]
    business_names = job["business_names"]

    # 백그라운드에서 크롤링 실행
    app_state = request.app.state

    async def _run():
        try:
            callback = await _crawl_callback_factory(app_state)
            await run_batch(batch_id, business_names, callback, delay_seconds=3)
        except Exception as e:
            from services.batch_processor import _batch_store
            if batch_id in _batch_store:
                _batch_store[batch_id]["status"] = "failed"
                _batch_store[batch_id]["error"] = str(e)

    background_tasks.add_task(asyncio.create_task, _run())

    return {
        "success": True,
        "batch_id": batch_id,
        "total": job["total"],
        "status": "pending",
        "message": f"배치 진단 시작됩니다. 총 {job['total']}개 업체",
    }


@router.get("/status/{batch_id}")
async def get_status(batch_id: str):
    """배치 진행 상태 조회."""
    status = get_batch_status(batch_id)
    if not status:
        raise HTTPException(status_code=404, detail="배치 ID를 찾을 수 없습니다.")

    # business_names는 응답에서 제외 (너무 김)
    response = {k: v for k, v in status.items() if k != "business_names"}
    return response


@router.post("/cancel/{batch_id}")
async def cancel_batch_job(batch_id: str):
    """배치 취소."""
    ok = cancel_batch(batch_id)
    if not ok:
        raise HTTPException(status_code=404, detail="배치 ID를 찾을 수 없습니다.")
    return {"success": True, "batch_id": batch_id, "message": "취소 요청됨"}


@router.get("/list")
async def get_batch_list():
    """전체 배치 목록 반환."""
    jobs = list_batch_jobs()
    # business_names 필드 제외하고 반환
    result = []
    for job in jobs:
        result.append({k: v for k, v in job.items() if k != "business_names"})
    return {"success": True, "jobs": result}
