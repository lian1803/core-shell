"""
crawlers/competitor_crawler.py — 경쟁사 상위 5개 크롤링 (신규)
세마포어(3)로 동시 실행 수 제한, 랜덤 딜레이 적용
"""
import sys
import os
import re
import asyncio
import random
import urllib.parse
from dataclasses import dataclass, field
from typing import List

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import USER_AGENTS, COMPETITOR_SEMAPHORE, log


@dataclass
class CompetitorData:
    name: str = ""
    place_id: str = ""
    photo_count: int = 0
    visitor_review_count: int = 0
    receipt_review_count: int = 0
    blog_review_count: int = 0
    save_count: int = 0
    has_reservation: bool = False
    has_hashtag: bool = False
    has_news_recent: bool = False  # 30일 이내 새소식 여부


async def _find_competitor_place_ids(browser, keyword: str, my_place_id: str, count: int = 5) -> List[str]:
    """검색 결과에서 상위 place_id 추출 (내 업체 제외)"""
    context = None
    page = None
    try:
        context = await browser.new_context(
            user_agent=random.choice(USER_AGENTS),
            viewport={"width": 390, "height": 844},
            locale="ko-KR",
        )
        page = await context.new_page()
        encoded = urllib.parse.quote(keyword)
        url = f"https://m.search.naver.com/search.naver?query={encoded}&where=m_local"
        await page.goto(url, timeout=30000)
        await page.wait_for_load_state("networkidle", timeout=20000)
        content = await page.content()

        # place_id 추출 (중복 제거, 순서 유지)
        raw_ids = re.findall(r'place\.naver\.com/\w+/(\d+)', content)
        seen = []
        for pid in raw_ids:
            if pid not in seen:
                seen.append(pid)

        # 내 업체 제외
        filtered = [pid for pid in seen if pid != my_place_id]
        log("Competitor", f"'{keyword}' 검색 → 경쟁사 {len(filtered)}개 발견 (상위 {count}개 사용)")
        return filtered[:count]

    except Exception as e:
        log("Competitor", f"place_id 탐색 오류: {e}")
        return []
    finally:
        if page:
            try:
                await page.close()
            except Exception:
                pass
        if context:
            try:
                await context.close()
            except Exception:
                pass


async def _crawl_one_competitor(browser, place_id: str) -> CompetitorData:
    """경쟁사 1개 크롤링 — 실패 시 기본값 반환"""
    data = CompetitorData(place_id=place_id)
    context = None
    page = None
    try:
        context = await browser.new_context(
            user_agent=random.choice(USER_AGENTS),
            viewport={"width": 390, "height": 844},
            locale="ko-KR",
        )
        page = await context.new_page()
        url = f"https://m.place.naver.com/place/{place_id}/home"
        await page.goto(url, timeout=25000)
        await page.wait_for_load_state("networkidle", timeout=20000)

        text = await page.inner_text("body")
        content = await page.content()

        # 업체명
        name_m = re.search(r'"name"\s*:\s*"([^"]+)"', content)
        if name_m:
            data.name = name_m.group(1)

        # 사진 수 (간단 패턴만, 별도 페이지 방문 생략)
        photo_m = re.search(r'SasImage[^}]*total["\s:]+(\d+)', content)
        if photo_m:
            data.photo_count = int(photo_m.group(1))

        # 리뷰 수
        rv = re.search(r"방문자 리뷰\s*([\d,]+)", text)
        if rv:
            data.visitor_review_count = int(rv.group(1).replace(",", ""))

        rv2 = re.search(r"블로그 리뷰\s*([\d,]+)", text)
        if rv2:
            data.blog_review_count = int(rv2.group(1).replace(",", ""))

        rv3 = re.search(r"영수증 리뷰\s*([\d,]+)", text)
        if rv3:
            data.receipt_review_count = int(rv3.group(1).replace(",", ""))

        # 저장 수
        save_m = re.search(r'"(?:saveCount|bookmarkCount)"\s*:\s*(\d+)', content)
        if save_m:
            data.save_count = int(save_m.group(1))
        else:
            save_t = re.search(r'저장\s*([\d,]+)', text)
            if save_t:
                data.save_count = int(save_t.group(1).replace(",", ""))

        # 기능 여부
        data.has_reservation = '"booking"' in content or "예약" in text
        data.has_hashtag = bool(re.search(r'#[가-힣a-zA-Z0-9_]+', text))
        data.has_news_recent = "새소식" in text or "소식" in text

        log("Competitor", f"크롤링 완료: {data.name} (사진={data.photo_count}, 리뷰={data.visitor_review_count})")

    except Exception as e:
        log("Competitor", f"place_id={place_id} 크롤링 실패 (스킵): {e}")
    finally:
        if page:
            try:
                await page.close()
            except Exception:
                pass
        if context:
            try:
                await context.close()
            except Exception:
                pass

    return data


async def get_competitors(browser, keyword: str, my_place_id: str, count: int = 5) -> List[CompetitorData]:
    """
    키워드로 경쟁사 place_id 추출 → 병렬 크롤링 (Semaphore 제한)
    성공한 경쟁사만 반환 (실패는 스킵)
    """
    place_ids = await _find_competitor_place_ids(browser, keyword, my_place_id, count)
    if not place_ids:
        log("Competitor", "경쟁사 place_id 없음 → 경쟁사 비교 생략")
        return []

    sem = asyncio.Semaphore(COMPETITOR_SEMAPHORE)

    async def _crawl_with_sem(pid: str) -> CompetitorData:
        async with sem:
            await asyncio.sleep(random.uniform(1.0, 3.0))
            return await _crawl_one_competitor(browser, pid)

    tasks = [_crawl_with_sem(pid) for pid in place_ids]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    # 예외 발생 결과 제외
    valid = [r for r in results if isinstance(r, CompetitorData)]
    log("Competitor", f"경쟁사 크롤링 완료: {len(valid)}/{len(place_ids)}개 성공")
    return valid
