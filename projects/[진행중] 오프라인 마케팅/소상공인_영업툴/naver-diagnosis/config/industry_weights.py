"""
업종별 가중치 및 기준값 설정
- 업종별 진단 점수 가중치
- 업종별 평균 객단가 (손익분기 계산용)
- 경쟁사 고정 평균값 (크롤링 실패 시 폴백용)
"""
from typing import Dict, Any

# ─────────────────────────────────────────────────────────────
# 업종별 진단 가중치
# 7개 항목 합계 = 1.0
# ─────────────────────────────────────────────────────────────
INDUSTRY_WEIGHTS: Dict[str, Dict[str, float]] = {
    "미용실": {
        "photo": 0.20,
        "review": 0.15,
        "blog": 0.10,
        "info": 0.10,
        "keyword": 0.10,
        "convenience": 0.15,
        "engagement": 0.20,
    },
    "네일": {
        "photo": 0.20,
        "review": 0.15,
        "blog": 0.10,
        "info": 0.10,
        "keyword": 0.10,
        "convenience": 0.15,
        "engagement": 0.20,
    },
    "피부관리": {
        "photo": 0.18,
        "review": 0.18,
        "blog": 0.14,
        "info": 0.12,
        "keyword": 0.10,
        "convenience": 0.14,
        "engagement": 0.14,
    },
    "식당": {
        "photo": 0.10,
        "review": 0.25,
        "blog": 0.10,
        "info": 0.15,
        "keyword": 0.10,
        "convenience": 0.15,
        "engagement": 0.15,
    },
    "카페": {
        "photo": 0.15,
        "review": 0.20,
        "blog": 0.15,
        "info": 0.10,
        "keyword": 0.10,
        "convenience": 0.15,
        "engagement": 0.15,
    },
    "학원": {
        "photo": 0.10,
        "review": 0.15,
        "blog": 0.20,
        "info": 0.15,
        "keyword": 0.15,
        "convenience": 0.10,
        "engagement": 0.15,
    },
    "default": {
        "photo": 0.15,
        "review": 0.20,
        "blog": 0.10,
        "info": 0.15,
        "keyword": 0.10,
        "convenience": 0.15,
        "engagement": 0.15,
    },
}

# ─────────────────────────────────────────────────────────────
# 업종 자동 감지 키워드
# category 필드에서 이 키워드가 포함되면 해당 업종으로 매핑
# ─────────────────────────────────────────────────────────────
INDUSTRY_KEYWORDS: Dict[str, list] = {
    "미용실": ["미용", "헤어", "헤어샵", "헤어살롱", "미용실"],
    "네일": ["네일", "젤네일", "손톱"],
    "피부관리": ["피부", "에스테틱", "왁싱", "관리샵", "스킨"],
    "식당": ["음식", "식당", "한식", "중식", "일식", "양식", "치킨", "피자", "분식", "고기", "삼겹살", "국밥", "면요리", "해산물", "초밥"],
    "카페": ["카페", "커피", "베이커리", "브런치", "디저트"],
    "학원": ["학원", "교습소", "교습", "레슨", "교육", "스쿨", "아카데미", "과외"],
}

# ─────────────────────────────────────────────────────────────
# 업종별 평균 객단가 (원)
# 손익분기 계산 시 사용: ceil(패키지금액 / 객단가) = 몇 명만 더 오면 본전
# ─────────────────────────────────────────────────────────────
INDUSTRY_AVG_PRICE: Dict[str, int] = {
    "미용실": 65000,   # 5~8만원 중간값
    "네일": 60000,     # 5~7만원 중간값
    "피부관리": 115000, # 8~15만원 중간값
    "식당": 20000,     # 1.5~3만원 중간값
    "카페": 8000,      # 6천~1만원
    "학원": 300000,    # 20~40만원 중간값
    "default": 30000,  # 기본값
}

# ─────────────────────────────────────────────────────────────
# 경쟁사 고정 평균값 (폴백)
# 크롤링 실패 시 업종별 지역 평균으로 대체
# ─────────────────────────────────────────────────────────────
COMPETITOR_FALLBACK: Dict[str, Dict[str, Any]] = {
    "미용실": {
        "avg_review": 180,
        "avg_photo": 35,
        "avg_blog": 15,
        "top_review": 500,
    },
    "네일": {
        "avg_review": 120,
        "avg_photo": 30,
        "avg_blog": 10,
        "top_review": 350,
    },
    "피부관리": {
        "avg_review": 80,
        "avg_photo": 25,
        "avg_blog": 12,
        "top_review": 220,
    },
    "식당": {
        "avg_review": 350,
        "avg_photo": 25,
        "avg_blog": 20,
        "top_review": 1000,
    },
    "카페": {
        "avg_review": 250,
        "avg_photo": 40,
        "avg_blog": 25,
        "top_review": 800,
    },
    "학원": {
        "avg_review": 60,
        "avg_photo": 15,
        "avg_blog": 30,
        "top_review": 150,
    },
    "default": {
        "avg_review": 150,
        "avg_photo": 25,
        "avg_blog": 15,
        "top_review": 400,
    },
}

# ─────────────────────────────────────────────────────────────
# 패키지 정가 (영업 메시지 손익분기 계산용)
# ─────────────────────────────────────────────────────────────
PACKAGES: Dict[str, Dict[str, Any]] = {
    "주목": {
        "price": 290000,
        "label": "주목 플랜",
        "emoji": "🔹",
        "description": "기본정보 최적화 + 키워드 등록 + 월 리포트",
    },
    "집중": {
        "price": 490000,
        "label": "집중 플랜",
        "emoji": "🔸",
        "description": "주목 + 사진 촬영 + 블로그 리뷰 관리 + 사장님 답글 대행",
    },
    "시선": {
        "price": 890000,
        "label": "시선 플랜",
        "emoji": "⭐",
        "description": "집중 + 인스타 관리 + 새소식 2회/월 + 전담 매니저",
    },
}


def detect_industry(category: str) -> str:
    """
    category 문자열에서 업종 자동 감지.
    매칭 없으면 'default' 반환.
    """
    if not category:
        return "default"
    cat_lower = category.lower()
    for industry, keywords in INDUSTRY_KEYWORDS.items():
        for kw in keywords:
            if kw in cat_lower:
                return industry
    return "default"


def get_weights(category: str) -> Dict[str, float]:
    """업종에 맞는 가중치 딕셔너리 반환."""
    industry = detect_industry(category)
    return INDUSTRY_WEIGHTS.get(industry, INDUSTRY_WEIGHTS["default"])


def get_avg_price(category: str) -> int:
    """업종 평균 객단가 반환."""
    industry = detect_industry(category)
    return INDUSTRY_AVG_PRICE.get(industry, INDUSTRY_AVG_PRICE["default"])


def get_competitor_fallback(category: str) -> Dict[str, Any]:
    """크롤링 실패 시 폴백 경쟁사 데이터 반환."""
    industry = detect_industry(category)
    return COMPETITOR_FALLBACK.get(industry, COMPETITOR_FALLBACK["default"])


def recommend_package(grade: str, weak_items: list) -> str:
    """
    등급과 취약 항목 기반 추천 패키지 반환.
    D등급 or 취약 항목 4개 이상 → 집중
    C등급 or 취약 항목 3개 이상 → 집중
    B등급 → 주목
    A등급 → 주목
    인스타/새소식 취약 있으면 시선 추천
    """
    has_sns_issue = any(item in weak_items for item in ["engagement", "convenience"])
    if has_sns_issue and grade in ("D", "C"):
        return "시선"
    if grade in ("D", "C") or len(weak_items) >= 3:
        return "집중"
    return "주목"
