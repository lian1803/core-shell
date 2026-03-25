"""
main.py — 네이버 플레이스 자동 진단 + PPT 영업 제안서 생성
사용법: python main.py
"""
import asyncio
import sys
import os
import re
from datetime import datetime
from playwright.async_api import async_playwright

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)

from config import EXCEL_PATH, TEMPLATE_PATH, OUTPUT_DIR, log
from file_io.excel_reader import read_all_businesses, extract_place_id
from crawlers.place_crawler import crawl_place, capture_search_screenshot
from crawlers.rank_crawler import get_keyword_rank
from crawlers.competitor_crawler import get_competitors
from api.keyword_api import get_keyword_stats
from scoring.engine import calc_score, calc_relative
from generators.ppt_generator import generate_ppt


async def process_one(row_data: dict, browser) -> str:
    """단일 업체 처리 → PPT 경로 반환"""
    business_name = str(row_data.get("업체명", "") or "")
    category = str(row_data.get("업종", "") or "")
    place_url = str(row_data.get("_place_url", "") or "")
    main_keyword = str(row_data.get("_main_keyword", "") or "")
    place_id = extract_place_id(place_url)

    if not place_id:
        log("Main", f"place_id 추출 실패: {place_url}")
        return ""

    log("Main", f"처리 시작: {business_name} | place_id={place_id} | 키워드={main_keyword}")

    # Step 1: 플레이스 크롤링
    log("Main", "Step 1: 플레이스 크롤링...")
    place_data = await crawl_place(browser, place_id)
    if place_data.name:
        business_name = place_data.name
    if place_data.category:
        category = place_data.category

    # 키워드가 없으면 place_data 기반으로 보완
    if not main_keyword:
        main_keyword = category or business_name

    # Step 2: 키워드 순위 조회
    log("Main", f"Step 2: '{main_keyword}' 순위 조회...")
    rank = await get_keyword_rank(browser, main_keyword, business_name, place_id)
    log("Main", f"  현재 순위: {rank}위" if rank else "  현재 순위: 미노출")

    # Step 3: 키워드 통계
    log("Main", "Step 3: 키워드 통계 조회...")
    keyword_stats = await get_keyword_stats(main_keyword)

    # Step 4: 경쟁사 크롤링
    log("Main", "Step 4: 경쟁사 크롤링...")
    competitors = []
    try:
        competitors = await get_competitors(browser, main_keyword, place_id)
    except Exception as e:
        log("Main", f"  경쟁사 크롤링 실패 (스킵): {e}")

    # Step 5: 검색 결과 스크린샷
    log("Main", "Step 5: 검색 스크린샷 촬영...")
    screenshot_path = ""
    try:
        screenshot_path = await capture_search_screenshot(browser, main_keyword, OUTPUT_DIR)
    except Exception as e:
        log("Main", f"  스크린샷 실패 (스킵): {e}")

    # Step 6: 점수 계산
    log("Main", "Step 6: 점수 계산...")
    score_result = calc_score(place_data, rank=rank)
    if competitors:
        score_result = calc_relative(score_result, competitors)

    # Step 7: PPT 생성
    log("Main", "Step 7: PPT 생성...")
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    safe_name = re.sub(r'[\\/:*?"<>|]', "_", business_name)
    output_path = os.path.join(OUTPUT_DIR, f"{safe_name}_분석보고서_{timestamp}.pptx")

    generate_ppt(
        template_path=TEMPLATE_PATH,
        output_path=output_path,
        business_name=business_name,
        category=category,
        place_data=place_data,
        keyword_stats=keyword_stats,
        main_keyword=main_keyword,
        rank=rank,
        score_result=score_result,
        competitors=competitors,
        screenshot_path=screenshot_path,
    )

    return output_path


async def main():
    print("=" * 60)
    print("네이버 플레이스 자동 진단 + PPT 영업 제안서 생성 시스템")
    print("=" * 60)

    # 엑셀 읽기
    log("Main", f"엑셀 읽기: {EXCEL_PATH}")
    businesses = read_all_businesses(EXCEL_PATH)
    if not businesses:
        print("엑셀에서 네이버 플레이스 URL을 찾을 수 없습니다.")
        return

    # CRITICAL: 배치 크기 안전 제한 (네이버 IP 차단 방지)
    MAX_BATCH = 10
    if len(businesses) > MAX_BATCH:
        print(f"\n⚠️  [경고] 한 번에 {MAX_BATCH}개 초과 시 네이버 IP 차단 위험!")
        print(f"   요청: {len(businesses)}개 → 앞 {MAX_BATCH}개만 처리합니다.")
        print(f"   나머지 {len(businesses) - MAX_BATCH}개는 나중에 따로 실행하세요.\n")
        businesses = businesses[:MAX_BATCH]

    print(f"\n총 {len(businesses)}개 업체 처리 시작...\n")

    # Playwright 브라우저 시작
    playwright = await async_playwright().start()
    browser = await playwright.chromium.launch(headless=True)

    results = []
    try:
        for i, row in enumerate(businesses, start=1):
            biz_name = str(row.get("업체명", "") or f"업체{i}")
            print(f"\n[{i}/{len(businesses)}] {biz_name} 처리 중...")
            try:
                ppt_path = await process_one(row, browser)
                if ppt_path:
                    results.append({"name": biz_name, "ppt": ppt_path, "ok": True})
                    log("Main", f"  완료: {ppt_path}")
                else:
                    results.append({"name": biz_name, "ppt": "", "ok": False})
                    log("Main", "  실패: PPT 미생성")
            except Exception as e:
                log("Main", f"  예외 발생 (다음 업체 계속): {e}")
                results.append({"name": biz_name, "ppt": "", "ok": False})

    finally:
        await browser.close()
        await playwright.stop()

    # 결과 요약
    print("\n" + "=" * 60)
    print("완료 요약")
    print("=" * 60)
    ok_count = sum(1 for r in results if r["ok"])
    print(f"성공: {ok_count}/{len(results)}개")
    for r in results:
        status = "완료" if r["ok"] else "실패"
        ppt_info = f"  -> {r['ppt']}" if r["ok"] else ""
        print(f"  [{status}] {r['name']}{ppt_info}")
    print("=" * 60)


if __name__ == "__main__":
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
    asyncio.run(main())
