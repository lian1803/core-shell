"""
scoring/engine.py — 22개 항목 점수 계산 엔진
절대 점수(100점 만점) + 경쟁사 대비 상대 등급
"""
import sys
import os
from dataclasses import dataclass, field
from typing import Dict, List, Any

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import get_grade, GRADE_COLOR, COLOR, log


def _tiered_score(value: int, tiers: List[tuple]) -> int:
    """
    구간별 점수 반환.
    tiers: [(min_value, score), ...] 오름차순 정렬 기준
    예: [(0,0),(5,3),(10,6),(20,8),(50,10)]
    """
    result = 0
    for min_val, score in tiers:
        if value >= min_val:
            result = score
        else:
            break
    return result


@dataclass
class ScoreResult:
    total_score: int = 0
    grade: str = "D"
    category_scores: Dict[str, int] = field(default_factory=dict)
    item_scores: Dict[str, int] = field(default_factory=dict)
    item_max: Dict[str, int] = field(default_factory=dict)
    competitor_avg: Dict[str, float] = field(default_factory=dict)
    relative_pct: int = 0       # 경쟁사 평균 대비 % (내 점수 / 경쟁사 평균 * 100)
    weak_points: List[str] = field(default_factory=list)  # 취약 항목 3개 (항목명)
    grade_color: Any = None     # RGBColor


# ── 점수 계산 함수 ────────────────────────────────────────────


def calc_score(place_data, rank: int = 0) -> ScoreResult:
    """
    PlaceData + rank → ScoreResult 반환
    place_data: PlaceData dataclass 또는 dict 모두 허용
    """
    # dataclass → dict 변환 지원
    if hasattr(place_data, '__dataclass_fields__'):
        d = {k: getattr(place_data, k) for k in place_data.__dataclass_fields__}
    else:
        d = dict(place_data)

    scores: Dict[str, int] = {}
    max_scores: Dict[str, int] = {}

    # ── 카테고리 A: 기본 정보 완성도 (20점) ─────────────────
    scores["업체명"] = 2 if d.get("name") else 0;         max_scores["업체명"] = 2
    scores["카테고리"] = 2 if d.get("category") else 0;   max_scores["카테고리"] = 2
    scores["주소"] = 2 if d.get("address") else 0;        max_scores["주소"] = 2
    scores["전화번호"] = 2 if d.get("phone") else 0;      max_scores["전화번호"] = 2
    scores["영업시간"] = 4 if d.get("has_hours") else 0;  max_scores["영업시간"] = 4
    scores["메뉴_가격"] = 4 if d.get("has_menu") else 0;  max_scores["메뉴_가격"] = 4
    scores["소개글"] = 4 if d.get("has_intro") else 0;    max_scores["소개글"] = 4

    # ── 카테고리 B: 콘텐츠 활성도 (35점) ───────────────────
    scores["사진수"] = _tiered_score(
        d.get("photo_count", 0),
        [(0,0),(1,2),(5,4),(20,6),(50,8)]
    ); max_scores["사진수"] = 8

    scores["방문자리뷰"] = _tiered_score(
        d.get("visitor_review_count", 0),
        [(0,0),(1,2),(10,4),(50,6),(200,8)]
    ); max_scores["방문자리뷰"] = 8

    scores["블로그리뷰"] = _tiered_score(
        d.get("blog_review_count", 0),
        [(0,0),(1,1),(5,3),(20,5)]
    ); max_scores["블로그리뷰"] = 5

    scores["영수증리뷰"] = _tiered_score(
        d.get("receipt_review_count", 0),
        [(0,0),(1,1),(10,2),(50,4)]
    ); max_scores["영수증리뷰"] = 4

    scores["저장수"] = _tiered_score(
        d.get("save_count", 0),
        [(0,0),(1,1),(10,3),(50,5)]
    ); max_scores["저장수"] = 5

    # 새소식 활성도 (days: 경과 일수)
    news_days = d.get("news_last_days", 9999)
    if news_days <= 30:
        scores["새소식"] = 5
    elif news_days <= 90:
        scores["새소식"] = 3
    elif news_days <= 365:
        scores["새소식"] = 1
    else:
        scores["새소식"] = 0
    max_scores["새소식"] = 5

    # ── 카테고리 C: 관리 운영 (20점) ────────────────────────
    reply_rate = d.get("owner_reply_rate", 0.0)
    if reply_rate >= 0.8:
        scores["사장님답글"] = 8
    elif reply_rate >= 0.5:
        scores["사장님답글"] = 6
    elif reply_rate >= 0.2:
        scores["사장님답글"] = 4
    elif reply_rate > 0:
        scores["사장님답글"] = 2
    else:
        scores["사장님답글"] = 0
    max_scores["사장님답글"] = 8

    scores["해시태그"] = 4 if d.get("has_hashtag") else 0; max_scores["해시태그"] = 4

    kw_count = len(d.get("keywords", []))
    if kw_count >= 3:
        scores["키워드등록"] = 4
    elif kw_count >= 1:
        scores["키워드등록"] = 2
    else:
        scores["키워드등록"] = 0
    max_scores["키워드등록"] = 4

    # 키워드 순위 점수 (D 카테고리 구분, 보너스 성격)
    if 1 <= rank <= 3:
        scores["키워드순위"] = 4
    elif rank <= 10:
        scores["키워드순위"] = 3
    elif rank <= 30:
        scores["키워드순위"] = 2
    elif rank > 30:
        scores["키워드순위"] = 1
    else:
        scores["키워드순위"] = 0
    max_scores["키워드순위"] = 4

    # ── 카테고리 D: 플랫폼 연동 (12점) ─────────────────────
    scores["네이버예약"] = 3 if d.get("has_reservation") else 0; max_scores["네이버예약"] = 3
    scores["네이버톡톡"] = 2 if d.get("has_talktalk") else 0;   max_scores["네이버톡톡"] = 2
    scores["스마트콜"] = 2 if d.get("has_smartcall") else 0;    max_scores["스마트콜"] = 2
    scores["쿠폰이벤트"] = 2 if d.get("has_coupon") else 0;     max_scores["쿠폰이벤트"] = 2

    # 새소식 연동 (has_news 기준)
    scores["새소식연동"] = 3 if d.get("has_news") else 0; max_scores["새소식연동"] = 3

    # ── 카테고리 E: 외부 채널 (8점) ─────────────────────────
    scores["인스타그램"] = 3 if d.get("has_instagram") else 0; max_scores["인스타그램"] = 3
    scores["카카오채널"] = 3 if d.get("has_kakao") else 0;    max_scores["카카오채널"] = 3
    scores["블로그연동"] = 2 if d.get("blog_review_count", 0) > 0 else 0; max_scores["블로그연동"] = 2

    # ── 합산 ────────────────────────────────────────────────
    total = sum(scores.values())

    # 카테고리별 소계
    cat_a = sum(scores[k] for k in ["업체명","카테고리","주소","전화번호","영업시간","메뉴_가격","소개글"])
    cat_b = sum(scores[k] for k in ["사진수","방문자리뷰","블로그리뷰","영수증리뷰","저장수","새소식"])
    cat_c = sum(scores[k] for k in ["사장님답글","해시태그","키워드등록","키워드순위"])
    cat_d = sum(scores[k] for k in ["네이버예약","네이버톡톡","스마트콜","쿠폰이벤트","새소식연동"])
    cat_e = sum(scores[k] for k in ["인스타그램","카카오채널","블로그연동"])

    grade = get_grade(total)
    grade_color = GRADE_COLOR.get(grade, COLOR["BAD"])

    # 취약 항목 3개 (비율 기준 낮은 순)
    item_ratios = {
        k: (scores[k] / max_scores[k]) if max_scores[k] > 0 else 1.0
        for k in scores
    }
    # 만점인 항목 제외 (개선 여지가 없는 항목)
    improvable = {k: v for k, v in item_ratios.items() if v < 1.0}
    weak_points = sorted(improvable, key=lambda k: improvable[k])[:3]

    result = ScoreResult(
        total_score=total,
        grade=grade,
        category_scores={
            "기본정보": cat_a,
            "콘텐츠": cat_b,
            "운영관리": cat_c,
            "플랫폼연동": cat_d,
            "외부채널": cat_e,
        },
        item_scores=scores,
        item_max=max_scores,
        weak_points=weak_points,
        grade_color=grade_color,
    )

    log("Score", f"총점={total}/100, 등급={grade}, 취약={weak_points}")
    return result


def calc_relative(my_result: ScoreResult, competitor_data_list: list) -> ScoreResult:
    """
    경쟁사 데이터 목록으로 상대 점수 계산.
    my_result를 업데이트해서 반환.
    """
    if not competitor_data_list:
        my_result.relative_pct = 0
        return my_result

    from scoring.engine import calc_score as _calc

    # 경쟁사 각각 점수 계산
    comp_scores = []
    for comp in competitor_data_list:
        try:
            r = _calc(comp)
            comp_scores.append(r.total_score)
        except Exception:
            pass

    if not comp_scores:
        return my_result

    avg = sum(comp_scores) / len(comp_scores)
    pct = int(my_result.total_score / max(avg, 1) * 100)
    my_result.relative_pct = pct

    # 경쟁사 평균 수치 (차트용)
    def avg_field(field_name):
        vals = []
        for comp in competitor_data_list:
            if hasattr(comp, field_name):
                vals.append(getattr(comp, field_name))
            elif isinstance(comp, dict):
                vals.append(comp.get(field_name, 0))
        return round(sum(vals) / len(vals), 1) if vals else 0.0

    my_result.competitor_avg = {
        "visitor_review_count": avg_field("visitor_review_count"),
        "photo_count": avg_field("photo_count"),
        "save_count": avg_field("save_count"),
        "blog_review_count": avg_field("blog_review_count"),
        "total_score": round(avg, 1),
    }

    log("Score", f"경쟁사 평균 {avg:.1f}점, 우리 업체 {pct}% 수준")
    return my_result
