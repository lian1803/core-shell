"""
dump_report.py — 진단 결과를 마크다운 파일로 출력 (PPT 없이 데이터 확인용)
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

from config import EXCEL_PATH, OUTPUT_DIR, log
from file_io.excel_reader import read_all_businesses, extract_place_id
from crawlers.place_crawler import crawl_place
from crawlers.rank_crawler import get_keyword_rank
from crawlers.competitor_crawler import get_competitors
from api.keyword_api import get_keyword_stats
from scoring.engine import calc_score, calc_relative, calc_lost_customers


def build_md(business_name, category, place_data, rank, keyword_stats,
             competitors, score_result, lost_customers) -> str:
    lines = []

    lines.append(f"# 네이버 플레이스 진단 리포트 — {business_name}")
    lines.append(f"> 생성일시: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    lines.append("")

    # ── 종합 점수 ────────────────────────────────────────
    lines.append("## 1. 종합 점수")
    lines.append("")
    lines.append(f"| 항목 | 값 |")
    lines.append(f"|------|-----|")
    lines.append(f"| 총점 | **{score_result.total_score} / 95점** |")
    lines.append(f"| 등급 | **{score_result.grade} 등급** |")
    if score_result.relative_pct:
        lines.append(f"| 경쟁사 평균 대비 | {score_result.relative_pct}% 수준 |")
    if lost_customers > 0:
        lines.append(f"| ⚠ 월 손실 추정 고객 수 | **{lost_customers:,}명** |")
    lines.append("")

    lines.append("### 카테고리별 점수")
    lines.append("")
    cat_max = {"기본정보": 20, "콘텐츠": 35, "운영관리": 20, "플랫폼연동": 12, "외부채널": 8}
    lines.append("| 카테고리 | 점수 | 만점 | 비율 |")
    lines.append("|----------|------|------|------|")
    for cat, score in score_result.category_scores.items():
        mx = cat_max.get(cat, 0)
        pct = int(score / mx * 100) if mx else 0
        bar = "█" * (pct // 10) + "░" * (10 - pct // 10)
        lines.append(f"| {cat} | {score} | {mx} | {bar} {pct}% |")
    lines.append("")

    # ── 22항목 체크리스트 ────────────────────────────────
    lines.append("## 2. 22항목 진단 체크리스트")
    lines.append("")

    check_map = {
        "업체명":     bool(getattr(place_data, 'name', '')),
        "카테고리":   bool(getattr(place_data, 'category', '')),
        "주소":       bool(getattr(place_data, 'address', '')),
        "전화번호":   bool(getattr(place_data, 'phone', '')),
        "영업시간":   getattr(place_data, 'has_hours', False),
        "메뉴/가격":  getattr(place_data, 'has_menu', False),
        "소개글":     getattr(place_data, 'has_intro', False),
        "사진수":     getattr(place_data, 'photo_count', 0),
        "방문자리뷰": getattr(place_data, 'visitor_review_count', 0),
        "블로그리뷰": getattr(place_data, 'blog_review_count', 0),
        "영수증리뷰": getattr(place_data, 'receipt_review_count', 0),
        "저장수":     getattr(place_data, 'save_count', 0),
        "새소식(일)": getattr(place_data, 'news_last_days', 9999),
        "사장님답글율": f"{int(getattr(place_data,'owner_reply_rate',0)*100)}%",
        "해시태그":   getattr(place_data, 'has_hashtag', False),
        "키워드등록": getattr(place_data, 'keywords', []),
        "네이버예약": getattr(place_data, 'has_reservation', False),
        "네이버톡톡": getattr(place_data, 'has_talktalk', False),
        "스마트콜":   getattr(place_data, 'has_smartcall', False),
        "쿠폰이벤트": getattr(place_data, 'has_coupon', False),
        "인스타그램": getattr(place_data, 'has_instagram', False),
        "카카오채널": getattr(place_data, 'has_kakao', False),
    }

    pass_check = {
        "업체명": True, "카테고리": True, "주소": True, "전화번호": True,
        "영업시간": True, "메뉴/가격": True, "소개글": True,
        "사진수": check_map["사진수"] >= 5,
        "방문자리뷰": check_map["방문자리뷰"] >= 10,
        "블로그리뷰": check_map["블로그리뷰"] >= 5,
        "영수증리뷰": check_map["영수증리뷰"] >= 10,
        "저장수": check_map["저장수"] >= 10,
        "새소식(일)": check_map["새소식(일)"] <= 90,
        "사장님답글율": getattr(place_data, 'owner_reply_rate', 0) >= 0.2,
        "해시태그": True, "키워드등록": len(check_map["키워드등록"]) >= 1,
        "네이버예약": True, "네이버톡톡": True, "스마트콜": True,
        "쿠폰이벤트": True, "인스타그램": True, "카카오채널": True,
    }
    # 실제 bool 값으로 pass 재계산
    for k in ["업체명","카테고리","주소","전화번호","영업시간","메뉴/가격","소개글",
              "해시태그","네이버예약","네이버톡톡","스마트콜","쿠폰이벤트","인스타그램","카카오채널"]:
        pass_check[k] = bool(check_map[k])

    lines.append("| 항목 | 현재값 | 판정 | 점수 |")
    lines.append("|------|--------|------|------|")
    for item, val in check_map.items():
        ok = pass_check.get(item, False)
        mark = "✅" if ok else "❌"
        s = score_result.item_scores.get(item.replace("/","_"), "-")
        mx = score_result.item_max.get(item.replace("/","_"), "-")
        score_str = f"{s}/{mx}" if s != "-" else "-"
        if isinstance(val, list):
            val_str = ", ".join(val) if val else "없음"
        else:
            val_str = str(val)
        lines.append(f"| {item} | {val_str} | {mark} | {score_str} |")
    lines.append("")

    # ── 취약 항목 TOP 3 ──────────────────────────────────
    lines.append("## 3. 취약 항목 TOP 3 (개선 우선순위)")
    lines.append("")
    for i, wp in enumerate(score_result.weak_points[:3], 1):
        s = score_result.item_scores.get(wp, 0)
        mx = score_result.item_max.get(wp, 0)
        lines.append(f"### {i}위. {wp}  ({s}/{mx}점)")
        # 현재 상태
        raw_map = {
            "사진수":     f"현재 {getattr(place_data,'photo_count',0)}장 (기준 50장 이상)",
            "방문자리뷰": f"현재 {getattr(place_data,'visitor_review_count',0)}개 (기준 200개 이상)",
            "블로그리뷰": f"현재 {getattr(place_data,'blog_review_count',0)}개 (기준 20개 이상)",
            "영수증리뷰": f"현재 {getattr(place_data,'receipt_review_count',0)}개 (기준 50개 이상)",
            "저장수":     f"현재 {getattr(place_data,'save_count',0)}개 (기준 50개 이상)",
            "새소식":     f"{getattr(place_data,'news_last_days',9999)}일 전 마지막 업데이트 (기준 30일 이내)",
            "사장님답글": f"응답률 {int(getattr(place_data,'owner_reply_rate',0)*100)}% (기준 80% 이상)",
            "해시태그":   "미설정 — 소개글에 #키워드 추가 필요",
            "전화번호":   "미등록 또는 수집 실패",
            "메뉴_가격":  "미등록 — 가격표 등록 필요",
            "소개글":     "미등록 — 업체 소개글 작성 필요",
            "네이버예약": "미연동 — 예약 시스템 연결 필요",
            "인스타그램": "미연동",
            "카카오채널": "미연동",
        }
        desc = raw_map.get(wp, "개선 필요")
        lines.append(f"- 상태: {desc}")
        # 경쟁사 비교
        comp_field_map = {
            "사진수": "photo_count",
            "방문자리뷰": "visitor_review_count",
            "저장수": "save_count",
            "블로그리뷰": "blog_review_count",
        }
        if wp in comp_field_map and score_result.competitor_avg:
            avg_val = score_result.competitor_avg.get(comp_field_map[wp], 0)
            if avg_val > 0:
                lines.append(f"- 경쟁사 평균: {avg_val:.0f}")
        lines.append("")

    # ── 키워드 + 순위 ────────────────────────────────────
    lines.append("## 4. 키워드 & 순위")
    lines.append("")
    pc = keyword_stats.get("pc", 0)
    mobile = keyword_stats.get("mobile", 0)
    lines.append(f"| 항목 | 값 |")
    lines.append(f"|------|-----|")
    lines.append(f"| 메인 키워드 | {category or business_name} |")
    lines.append(f"| 월 PC 검색량 | {pc:,}회 |")
    lines.append(f"| 월 모바일 검색량 | {mobile:,}회 |")
    lines.append(f"| 현재 플레이스 순위 | {rank}위 |")
    if lost_customers > 0:
        lines.append(f"| 월 손실 추정 고객 수 | **{lost_customers:,}명** |")
    lines.append("")

    related = keyword_stats.get("related", [])
    if getattr(place_data, 'keywords', []):
        lines.append(f"**플레이스 등록 키워드:** {', '.join(place_data.keywords)}")
        lines.append("")
    if related:
        lines.append("### 연관 키워드")
        lines.append("| 키워드 | 모바일 검색량 |")
        lines.append("|--------|--------------|")
        for kw in related[:10]:
            lines.append(f"| {kw['keyword']} | {kw.get('mobile',0):,} |")
        lines.append("")

    # ── 경쟁사 비교 ──────────────────────────────────────
    if competitors:
        lines.append("## 5. 경쟁사 비교")
        lines.append("")
        lines.append("| 업체명 | 방문자리뷰 | 사진수 | 저장수 | 등급 |")
        lines.append("|--------|-----------|--------|--------|------|")
        from scoring.engine import calc_score as _cs
        for comp in competitors:
            n = getattr(comp, 'name', '알 수 없음')
            rv = getattr(comp, 'visitor_review_count', 0)
            ph = getattr(comp, 'photo_count', 0)
            sv = getattr(comp, 'save_count', 0)
            try:
                cg = _cs(comp).grade
            except Exception:
                cg = "-"
            lines.append(f"| {n} | {rv:,} | {ph} | {sv} | {cg} |")
        lines.append("")

        avg = score_result.competitor_avg
        if avg:
            lines.append("### 경쟁사 평균 vs 우리 업체")
            lines.append("| 항목 | 우리 업체 | 경쟁사 평균 | 차이 |")
            lines.append("|------|-----------|-------------|------|")
            my_rv = getattr(place_data, 'visitor_review_count', 0)
            my_ph = getattr(place_data, 'photo_count', 0)
            my_sv = getattr(place_data, 'save_count', 0)
            avg_rv = avg.get("visitor_review_count", 0)
            avg_ph = avg.get("photo_count", 0)
            avg_sv = avg.get("save_count", 0)
            def diff_str(mine, av):
                if av <= 0: return "N/A"
                d = int((mine - av) / av * 100)
                return f"{d:+d}%"
            lines.append(f"| 방문자리뷰 | {my_rv:,} | {avg_rv:.0f} | {diff_str(my_rv, avg_rv)} |")
            lines.append(f"| 사진수 | {my_ph} | {avg_ph:.0f} | {diff_str(my_ph, avg_ph)} |")
            lines.append(f"| 저장수 | {my_sv} | {avg_sv:.0f} | {diff_str(my_sv, avg_sv)} |")
            lines.append("")

    # ── 업체 기본 정보 ───────────────────────────────────
    lines.append("## 6. 수집된 업체 기본 정보 (원본)")
    lines.append("")
    lines.append(f"| 필드 | 값 |")
    lines.append(f"|------|----|")
    fields = [
        ("업체명", 'name'), ("카테고리", 'category'), ("주소", 'address'),
        ("전화번호", 'phone'), ("영업시간 등록", 'has_hours'), ("메뉴/가격", 'has_menu'),
        ("소개글", 'has_intro'), ("사진수", 'photo_count'), ("방문자리뷰", 'visitor_review_count'),
        ("블로그리뷰", 'blog_review_count'), ("영수증리뷰", 'receipt_review_count'),
        ("저장수", 'save_count'), ("새소식(마지막 일)", 'news_last_days'),
        ("사장님답글율", 'owner_reply_rate'), ("해시태그", 'has_hashtag'),
        ("키워드", 'keywords'), ("네이버예약", 'has_reservation'),
        ("네이버톡톡", 'has_talktalk'), ("스마트콜", 'has_smartcall'),
        ("쿠폰이벤트", 'has_coupon'), ("인스타그램", 'has_instagram'),
        ("카카오채널", 'has_kakao'),
    ]
    for label, attr in fields:
        val = getattr(place_data, attr, "N/A")
        if isinstance(val, list):
            val = ", ".join(val) if val else "없음"
        elif isinstance(val, float):
            val = f"{val:.2f}"
        lines.append(f"| {label} | {val} |")
    lines.append("")

    return "\n".join(lines)


async def main():
    businesses = read_all_businesses(EXCEL_PATH)
    if not businesses:
        print("엑셀에서 URL을 찾을 수 없습니다.")
        return

    playwright = await async_playwright().start()
    browser = await playwright.chromium.launch(headless=True)

    try:
        for row in businesses:
            business_name = str(row.get("업체명", "") or "업체")
            category = str(row.get("업종", "") or "")
            place_url = str(row.get("_place_url", "") or "")
            main_keyword = str(row.get("_main_keyword", "") or "")
            from file_io.excel_reader import extract_place_id
            place_id = extract_place_id(place_url)
            if not place_id:
                continue

            print(f"진단 중: {business_name} ...")

            place_data = await crawl_place(browser, place_id)
            if place_data.name:
                business_name = place_data.name
            if place_data.category:
                category = place_data.category
            if not main_keyword:
                main_keyword = category or business_name

            rank = await get_keyword_rank(browser, main_keyword, business_name, place_id)
            keyword_stats = await get_keyword_stats(main_keyword)
            competitors = []
            try:
                competitors = await get_competitors(browser, main_keyword, place_id)
            except Exception:
                pass

            score_result = calc_score(place_data, rank=rank)
            if competitors:
                score_result = calc_relative(score_result, competitors)

            monthly_searches = keyword_stats.get("mobile", 0)
            lost_customers = calc_lost_customers(rank, monthly_searches)

            md = build_md(business_name, category, place_data, rank,
                          keyword_stats, competitors, score_result, lost_customers)

            safe_name = re.sub(r'[\\/:*?"<>|]', "_", business_name)
            ts = datetime.now().strftime("%Y%m%d_%H%M%S")
            out_path = os.path.join(OUTPUT_DIR, f"{safe_name}_진단리포트_{ts}.md")
            with open(out_path, "w", encoding="utf-8") as f:
                f.write(md)

            print(f"\n저장 완료: {out_path}\n")
            print("=" * 60)
            print(md)
            print("=" * 60)

    finally:
        await browser.close()
        await playwright.stop()


if __name__ == "__main__":
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
    asyncio.run(main())
