"""
영업 메시지 자동 생성기
진단 데이터 기반 1차~4차 영업 메시지 생성
원칙: 문제는 보여주되, 해결법은 절대 안 알려준다
"""
import math
from typing import Dict, Any, List

from config.industry_weights import (
    get_avg_price,
    recommend_package,
    PACKAGES,
    detect_industry,
)


# ─────────────────────────────────────────────────────────────
# 내부 헬퍼
# ─────────────────────────────────────────────────────────────

def _estimate_lost_customers(rank: int, monthly_search: int) -> int:
    """
    순위와 월 검색량 기반 손실 고객 수 추정.
    1~3위: 클릭률 ~30%, 4~10위: ~15%, 11~20위: ~5%, 20위+: ~2%
    """
    if rank <= 0 or monthly_search <= 0:
        return 0
    if rank <= 3:
        my_ctr = 0.30
    elif rank <= 10:
        my_ctr = 0.15
    elif rank <= 20:
        my_ctr = 0.05
    else:
        my_ctr = 0.02
    # 1위 가정 클릭률 30% 대비 현재 차이
    top_ctr = 0.30
    lost = int((top_ctr - my_ctr) * monthly_search)
    return max(0, lost)


def _select_first_message_type(data: Dict[str, Any]) -> str:
    """
    1차 메시지 타입 자동 선택 로직.
    A: 리뷰 격차형
    B: 손실 고객형
    C: 방치형
    """
    my_review = data.get("review_count", 0)
    competitor_avg_review = data.get("competitor_avg_review", 0)
    rank = data.get("naver_place_rank", 0)
    monthly_search = _get_top_keyword_volume(data.get("keywords", []))
    news_days = data.get("news_last_days", 0)  # 새소식 마지막 업데이트 일수

    # 조건 A: 경쟁사 리뷰 >= 내 리뷰 × 5
    if competitor_avg_review > 0 and competitor_avg_review >= my_review * 5:
        return "A"
    # 조건 B: 순위 > 10 AND 월검색 >= 500
    if rank > 10 and monthly_search >= 500:
        return "B"
    # 조건 C: 새소식 90일+ OR 저장수 = 0
    if news_days >= 90 or data.get("bookmark_count", 0) == 0:
        return "C"
    # 기본값
    return "A"


def _get_top_keyword_volume(keywords: list) -> int:
    """키워드 목록에서 가장 높은 검색량 반환."""
    if not keywords:
        return 0
    volumes = []
    for kw in keywords:
        if isinstance(kw, dict):
            volumes.append(kw.get("search_volume", 0))
    return max(volumes) if volumes else 0


def _get_top_keyword_name(keywords: list) -> str:
    """가장 검색량 높은 키워드 이름 반환."""
    if not keywords:
        return "이 지역 키워드"
    best = None
    best_vol = 0
    for kw in keywords:
        if isinstance(kw, dict):
            vol = kw.get("search_volume", 0)
            if vol > best_vol:
                best_vol = vol
                best = kw.get("keyword", "")
        elif isinstance(kw, str) and best is None:
            best = kw
    return best or "이 지역 키워드"


def _get_industry_label(category: str) -> str:
    """업종 라벨 반환 (메시지용 자연스러운 표현)."""
    industry = detect_industry(category or "")
    labels = {
        "미용실": "미용실",
        "네일": "네일샵",
        "피부관리": "피부관리샵",
        "식당": "식당",
        "카페": "카페",
        "학원": "학원",
        "default": "업체",
    }
    return labels.get(industry, "업체")


def _build_weak_items(data: Dict[str, Any]) -> List[str]:
    """취약 항목 키 목록 반환."""
    weak = []
    if data.get("photo_score", 100) < 50:
        weak.append("photo")
    if data.get("review_score", 100) < 50:
        weak.append("review")
    if data.get("blog_score", 100) < 50:
        weak.append("blog")
    if data.get("info_score", 100) < 50:
        weak.append("info")
    if data.get("keyword_score", 100) < 50:
        weak.append("keyword")
    if data.get("convenience_score", 100) < 50:
        weak.append("convenience")
    if data.get("engagement_score", 100) < 50:
        weak.append("engagement")
    return weak


def _build_good_items(data: Dict[str, Any]) -> List[str]:
    """잘 된 항목 3개 이하 반환."""
    ITEM_LABELS = {
        "photo": f"사진 {data.get('photo_count', 0)}장 등록됨",
        "review": f"리뷰 {data.get('review_count', 0)}개 보유",
        "blog": f"블로그 리뷰 {data.get('blog_review_count', 0)}개",
        "info": "기본 정보 등록됨",
        "keyword": "키워드 등록됨",
        "convenience": "편의기능 활성화",
        "engagement": "고객 참여 관리 중",
    }
    good = []
    score_keys = ["photo", "review", "blog", "info", "keyword", "convenience", "engagement"]
    for key in score_keys:
        if data.get(f"{key}_score", 0) >= 60:
            good.append(ITEM_LABELS.get(key, key))
    return good[:3]


def _build_weak_items_text(data: Dict[str, Any]) -> List[str]:
    """취약 항목 텍스트 리스트 (2차 메시지용)."""
    items = []
    if data.get("photo_score", 100) < 50:
        count = data.get("photo_count", 0)
        items.append(f"사진: {count}장  →  기준 15장 이상")
    if data.get("review_score", 100) < 50:
        count = data.get("review_count", 0)
        items.append(f"리뷰: {count}개  →  기준 30개 이상")
    if data.get("blog_score", 100) < 50:
        count = data.get("blog_review_count", 0)
        items.append(f"블로그 리뷰: {count}개  →  기준 10개 이상")
    if data.get("info_score", 100) < 50:
        items.append("기본 정보: 항목 미완성")
    if data.get("keyword_score", 100) < 50:
        items.append("키워드: 등록 부족")
    if data.get("convenience_score", 100) < 50:
        items.append("편의기능: 미활성화 항목 있음")
    if data.get("engagement_score", 100) < 50:
        items.append("고객 소통: 관리 부족")
    return items


# ─────────────────────────────────────────────────────────────
# 메인 생성 함수
# ─────────────────────────────────────────────────────────────

def generate_first_message(data: Dict[str, Any]) -> Dict[str, str]:
    """
    1차 메시지 생성.
    Returns: {"type": "A"|"B"|"C", "text": "...", "label": "..."}
    """
    msg_type = _select_first_message_type(data)
    business_name = data.get("business_name", "사장님")
    category = data.get("category", "")
    industry_label = _get_industry_label(category)

    competitor_avg_review = data.get("competitor_avg_review", 0)
    my_review = data.get("review_count", 0)
    rank = data.get("naver_place_rank", 0)
    monthly_search = _get_top_keyword_volume(data.get("keywords", []))
    top_keyword = _get_top_keyword_name(data.get("keywords", []))
    news_days = data.get("news_last_days", 0)

    lost_customers = _estimate_lost_customers(rank, monthly_search)

    if msg_type == "A":
        if competitor_avg_review > 0 and my_review > 0:
            text = (
                f"{business_name} 사장님, 안녕하세요.\n"
                f"이 지역 {industry_label}들 플레이스 분석하다가 연락드렸는데요.\n"
                f"이 동네 상위 업체 리뷰 평균이 {competitor_avg_review}개인데\n"
                f"사장님 가게는 {my_review}개더라고요.\n"
                f"진단 결과 보내드려도 될까요?"
            )
        else:
            text = (
                f"{business_name} 사장님, 안녕하세요.\n"
                f"이 지역 {industry_label} 플레이스 분석하다가 연락드렸어요.\n"
                f"리뷰 관련해서 놓치고 계신 게 있는 것 같아서요.\n"
                f"무료 진단 결과 보내드려도 될까요?"
            )
        label = "리뷰 격차형"

    elif msg_type == "B":
        if lost_customers > 0:
            text = (
                f"{business_name} 사장님, 안녕하세요.\n"
                f"'{top_keyword}' 지금 {rank}위이신데, 이 위치면\n"
                f"매달 약 {lost_customers}명 정도가 상위 업체로 가고 있어요.\n"
                f"무료 진단 결과 보내드려도 될까요?"
            )
        else:
            text = (
                f"{business_name} 사장님, 안녕하세요.\n"
                f"'{top_keyword}' 검색 시 현재 {rank}위이신데\n"
                f"1~5위 사이에 없으면 사실상 안 보이는 거거든요.\n"
                f"무료 진단 결과 보내드려도 될까요?"
            )
        label = "손실 고객형"

    else:  # C
        if news_days >= 90:
            text = (
                f"{business_name} 사장님, 안녕하세요.\n"
                f"플레이스 새소식이 {news_days}일째 없으신 걸 봤는데,\n"
                f"네이버가 요즘 이걸 되게 중요하게 보거든요.\n"
                f"진단 결과 보내드려도 될까요?"
            )
        else:
            text = (
                f"{business_name} 사장님, 안녕하세요.\n"
                f"플레이스 점검하다가 몇 가지 빠진 항목이 보여서 연락드렸어요.\n"
                f"지금 이 상태면 검색 노출에서 손해 보고 계실 수 있어요.\n"
                f"무료 진단 결과 보내드려도 될까요?"
            )
        label = "방치형"

    return {"type": msg_type, "text": text, "label": label}


def generate_second_message(data: Dict[str, Any]) -> str:
    """
    2차 메시지 생성 — 진단 결과 카톡 카드 형식.
    문제만 보여준다. 해결법 언급 금지.
    """
    business_name = data.get("business_name", "업체")
    total_score = data.get("total_score", 0)
    grade = data.get("grade", "D")
    rank = data.get("naver_place_rank", 0)

    monthly_search = _get_top_keyword_volume(data.get("keywords", []))
    lost_customers = _estimate_lost_customers(rank, monthly_search)

    good_items = _build_good_items(data)
    weak_items_text = _build_weak_items_text(data)
    weak_count = len(weak_items_text)

    competitor_avg_review = data.get("competitor_avg_review", 0)
    competitor_avg_photo = data.get("competitor_avg_photo", 0)
    my_review = data.get("review_count", 0)
    my_photo = data.get("photo_count", 0)

    # 지역 상위 대비 비율 (간단 추정)
    # total_score 기준 상위 평균을 75점으로 가정
    relative_pct = min(100, int((total_score / 75) * 100)) if total_score > 0 else 0

    lines = [
        f"📊 [{business_name}] 네이버 플레이스 진단 결과입니다.",
        "",
        "━━━━━━━━━━━━━━━━━━",
        f"⭐ 종합 점수: {total_score:.0f}점 ({grade}등급)",
        f"   이 지역 상위 업체 대비 {relative_pct}% 수준",
        "━━━━━━━━━━━━━━━━━━",
        "",
    ]

    if good_items:
        lines.append("✅ 잘 되어 있는 것")
        for item in good_items:
            lines.append(f"  - {item}")
        lines.append("")

    if weak_items_text:
        lines.append(f"❌ 지금 비어있는 것 ({weak_count}개)")
        for item in weak_items_text:
            lines.append(f"  {item}")
        lines.append("")

    if competitor_avg_review > 0 or competitor_avg_photo > 0:
        lines.append("📊 경쟁사 비교")
        if competitor_avg_review > 0:
            lines.append(f"  리뷰: 사장님 {my_review}개  |  경쟁사 평균 {competitor_avg_review}개")
        if competitor_avg_photo > 0:
            lines.append(f"  사진: 사장님 {my_photo}장  |  경쟁사 평균 {competitor_avg_photo}장")
        lines.append("━━━━━━━━━━━━━━━━━━")
        lines.append("")

    if lost_customers > 0:
        lines.append(f"⚠️ 현재 순위 기준, 매달 약 {lost_customers}명이")
        lines.append("   경쟁사로 가고 있는 걸로 추정돼요.")
        lines.append("━━━━━━━━━━━━━━━━━━")
        lines.append("")

    lines.append("어떻게 생각하세요?")

    return "\n".join(lines)


def generate_third_message(data: Dict[str, Any]) -> str:
    """
    3차 메시지 — 패키지 + 손익분기 계산.
    """
    category = data.get("category", "")
    avg_price = get_avg_price(category)
    rank = data.get("naver_place_rank", 0)
    monthly_search = _get_top_keyword_volume(data.get("keywords", []))
    lost_customers = _estimate_lost_customers(rank, monthly_search)

    weak_items = _build_weak_items(data)
    recommended = recommend_package(data.get("grade", "D"), weak_items)
    pkg = PACKAGES[recommended]
    plan_price = pkg["price"]

    # 취약 TOP2 라벨
    item_labels = {
        "photo": "사진 관리",
        "review": "리뷰 수집",
        "blog": "블로그 노출",
        "info": "기본 정보 완성",
        "keyword": "키워드 최적화",
        "convenience": "편의기능 세팅",
        "engagement": "고객 소통",
    }
    top2 = [item_labels.get(k, k) for k in weak_items[:2]]
    top2_text = "과 ".join(top2) if top2 else "전반적인 최적화"

    # 손익분기 고객 수
    breakeven = math.ceil(plan_price / avg_price) if avg_price > 0 else 0

    lines = [
        "사장님, 진단 결과 정리해드리면",
        "",
        f"지금 가장 급한 게 {top2_text}인데요,",
        "이 부분만 잡아도 순위가 달라져요.",
        "",
        "저희 서비스 3가지 플랜이에요:",
        "",
        "─────────────────────",
        "🔹 주목 플랜  290,000원/월",
        "  기본정보 최적화 + 키워드 등록 + 월 리포트",
        "",
        "🔸 집중 플랜  490,000원/월",
        "  주목 + 사진 촬영 + 블로그 리뷰 관리",
        "  + 사장님 답글 대행",
        "",
        "⭐ 시선 플랜  890,000원/월",
        "  집중 + 인스타 관리 + 새소식 2회/월",
        "  + 전담 매니저",
        "─────────────────────",
        "",
        f"사장님한테는 {pkg['label']}이 맞을 것 같아요.",
        "",
    ]

    if lost_customers > 0 and breakeven > 0:
        lines += [
            f"지금 매달 {lost_customers}명이 경쟁사로 가고 있는데,",
            f"{pkg['label']} 한 달 비용이 {plan_price:,}원이거든요.",
            f"고객 {breakeven}명만 더 오시면 본전이에요.",
            "",
        ]

    lines.append("한번 해보실 의향 있으세요?")

    return "\n".join(lines)


def generate_fourth_messages(data: Dict[str, Any]) -> Dict[str, str]:
    """
    4차 메시지 — 4가지 상황별 버전.
    Returns: {"보류": "...", "무응답": "...", "비싸다": "...", "직접": "..."}
    """
    category = data.get("category", "")
    avg_price = get_avg_price(category)
    rank = data.get("naver_place_rank", 0)
    monthly_search = _get_top_keyword_volume(data.get("keywords", []))
    lost_customers = _estimate_lost_customers(rank, monthly_search)

    weak_items = _build_weak_items(data)
    recommended = recommend_package(data.get("grade", "D"), weak_items)
    pkg = PACKAGES[recommended]
    plan_price = pkg["price"]

    # 손실 금액
    loss_amount = lost_customers * avg_price if lost_customers > 0 else 0
    breakeven = math.ceil(plan_price / avg_price) if avg_price > 0 else 0
    weak_count = len(weak_items)

    # 주소에서 지역명 추출 (없으면 기본값)
    address = data.get("address", "")
    region = "이 지역"
    if address:
        parts = address.split()
        if len(parts) >= 2:
            region = parts[1] if len(parts[1]) <= 4 else parts[0]

    # [무응답/보류용]
    no_response = (
        "사장님, 혹시 확인하셨나요?\n"
        "\n"
        "저희가 이번 달 신규 업체 3곳 더 받으면 마감인데,\n"
        f"사장님 지역 경쟁사 중 한 곳도 문의 주셨거든요.\n"
        "\n"
        "같은 지역 업체를 동시에 진행하진 않아서요,\n"
        f"이번 달 안에 결정해주시면 {region} 독점으로 진행해드릴 수 있어요.\n"
        "\n"
        "어떻게 하시겠어요?"
    )

    # [비싸다고 할 때]
    if lost_customers > 0 and loss_amount > 0:
        expensive = (
            "그 마음 충분히 이해해요.\n"
            "\n"
            "근데 계산해보면요,\n"
            f"{pkg['label']} 한 달 {plan_price:,}원인데\n"
            f"지금 매달 {lost_customers}명이 경쟁사로 가고 있고\n"
            f"한 명당 {avg_price:,}원이면 월 {loss_amount:,}원 손실이거든요.\n"
            "\n"
            "안 하는 게 더 비싼 거예요.\n"
            "\n"
            "일단 3개월만 해보시고,\n"
            "효과 없으면 그때 말씀해주세요."
        )
    else:
        expensive = (
            "그 마음 충분히 이해해요.\n"
            "\n"
            "근데 지금 플레이스 최적화 안 하면\n"
            "검색에서 계속 밀리는 구조라서요.\n"
            "\n"
            "일단 3개월만 해보시고,\n"
            "효과 없으면 그때 말씀해주세요."
        )

    # [직접 해보겠다고 할 때]
    time_per_week = max(3, weak_count)  # 취약 항목 수 기반 시간 추정
    diy = (
        "당연히 하실 수 있어요.\n"
        "\n"
        f"근데 아까 진단 결과에서 X 뜬 항목이 {weak_count}개였는데,\n"
        "하나하나 다 시간이 걸리는 거라서요.\n"
        f"사장님이 직접 하시는 데 매주 {time_per_week}시간은 써야 해요.\n"
        "\n"
        "그 시간에 손님 보시는 게 낫지 않으세요?\n"
        "저희가 대신 할게요."
    )

    return {
        "보류": no_response,
        "무응답": no_response,
        "비싸다": expensive,
        "직접": diy,
    }


def generate_all_messages(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    1~4차 메시지 전체 생성.
    Returns: {
        "first": {"type": "A", "text": "...", "label": "..."},
        "second": "...",
        "third": "...",
        "fourth": {"보류": "...", "무응답": "...", "비싸다": "...", "직접": "..."},
        "recommended_package": "집중",
        "estimated_lost_customers": 45,
    }
    """
    try:
        rank = data.get("naver_place_rank", 0)
        monthly_search = _get_top_keyword_volume(data.get("keywords", []))
        lost_customers = _estimate_lost_customers(rank, monthly_search)

        weak_items = _build_weak_items(data)
        recommended = recommend_package(data.get("grade", "D"), weak_items)

        return {
            "first": generate_first_message(data),
            "second": generate_second_message(data),
            "third": generate_third_message(data),
            "fourth": generate_fourth_messages(data),
            "recommended_package": recommended,
            "estimated_lost_customers": lost_customers,
        }
    except Exception as e:
        # 생성 실패 시 빈 구조 반환 (진단 자체가 실패하면 안 됨)
        return {
            "first": {"type": "A", "text": f"메시지 생성 오류: {str(e)}", "label": "오류"},
            "second": "",
            "third": "",
            "fourth": {"보류": "", "무응답": "", "비싸다": "", "직접": ""},
            "recommended_package": "집중",
            "estimated_lost_customers": 0,
        }
