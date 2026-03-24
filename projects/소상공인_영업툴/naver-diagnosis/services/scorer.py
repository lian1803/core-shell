"""
네이버 플레이스 진단 점수 산출
각 항목별 점수 계산 및 개선 포인트 생성
7개 항목으로 확장됨 (photo, review, blog, info, keyword, convenience, engagement)
"""
from typing import Dict, List, Any


class DiagnosisScorer:
    """진단 점수 산출기"""

    # 점수 가중치 (7개 항목)
    WEIGHTS = {
        "photo": 0.15,
        "review": 0.20,
        "blog": 0.10,
        "info": 0.15,           # 영업시간+소개+오시는길+메뉴
        "keyword": 0.10,
        "convenience": 0.15,    # 예약+톡톡+스마트콜+쿠폰+새소식
        "engagement": 0.15,     # 사장님답글+외부채널+메뉴상세
    }

    @staticmethod
    def calculate_photo_score(photo_count: int) -> float:
        """
        사진 점수 계산
        0장 -> 0점, 1-4장 -> 40점, 5-9장 -> 70점, 10-14장 -> 85점, 15+장 -> 100점
        """
        if photo_count <= 0:
            return 0.0
        elif photo_count <= 4:
            return 40.0
        elif photo_count <= 9:
            return 70.0
        elif photo_count <= 14:
            return 85.0
        else:
            return 100.0

    @staticmethod
    def calculate_review_score(review_count: int) -> float:
        """
        리뷰 점수 계산 (영수증 + 방문자 리뷰 합계 기준)
        0 -> 0점, 1-9 -> 30점, 10-29 -> 60점, 30-49 -> 80점, 50+ -> 100점
        """
        if review_count <= 0:
            return 0.0
        elif review_count <= 9:
            return 30.0
        elif review_count <= 29:
            return 60.0
        elif review_count <= 49:
            return 80.0
        else:
            return 100.0

    @staticmethod
    def calculate_blog_score(blog_count: int) -> float:
        """
        블로그 리뷰 점수 계산
        0 -> 0점, 1-4 -> 40점, 5-9 -> 70점, 10-19 -> 85점, 20+ -> 100점
        """
        if blog_count <= 0:
            return 0.0
        elif blog_count <= 4:
            return 40.0
        elif blog_count <= 9:
            return 70.0
        elif blog_count <= 19:
            return 85.0
        else:
            return 100.0

    @staticmethod
    def calculate_info_score(
        has_hours: bool,
        has_menu: bool,
        has_price: bool,
        has_intro: bool = False,
        has_directions: bool = False
    ) -> float:
        """
        정보 완성도 점수 계산 (확장)
        영업시간(25점) + 메뉴(25점) + 가격(15점) + 소개(20점) + 오시는길(15점) = 최대 100점
        """
        score = 0.0
        if has_hours:
            score += 25.0
        if has_menu:
            score += 25.0
        if has_price:
            score += 15.0
        if has_intro:
            score += 20.0
        if has_directions:
            score += 15.0
        return min(score, 100.0)

    @staticmethod
    def calculate_keyword_score(keywords: List) -> float:
        """
        키워드 점수 계산
        - 키워드 수만 있는 경우 (문자열): 키워드 개수로 기본 점수
        - 검색량 데이터 있는 경우 (딕셔너리): 검색량 기반 보너스

        키워드 등록 자체가 중요하므로 키워드 수에도 점수 부여:
        0개 -> 0점, 1-2개 -> 20점, 3-4개 -> 40점, 5-6개 -> 60점, 7+개 -> 80점
        검색량 보너스: 1000-4999 -> +10, 5000-9999 -> +15, 10000+ -> +20
        """
        keyword_count = len(keywords)

        if keyword_count == 0:
            return 0.0

        # 기본 점수 (키워드 개수)
        if keyword_count <= 2:
            base_score = 20.0
        elif keyword_count <= 4:
            base_score = 40.0
        elif keyword_count <= 6:
            base_score = 60.0
        else:
            base_score = 80.0

        # 검색량 보너스
        total_volume = sum(kw.get("search_volume", 0) for kw in keywords if isinstance(kw, dict))
        if total_volume >= 10000:
            base_score = min(base_score + 20, 100.0)
        elif total_volume >= 5000:
            base_score = min(base_score + 15, 100.0)
        elif total_volume >= 1000:
            base_score = min(base_score + 10, 100.0)

        return base_score

    @staticmethod
    def calculate_convenience_score(
        has_booking: bool,
        has_talktalk: bool,
        has_smartcall: bool,
        has_coupon: bool,
        has_news: bool
    ) -> float:
        """
        편의기능 점수: 각 항목별 점수 합산 최대 100점
        - 네이버 예약: 25점
        - 톡톡: 20점
        - 스마트콜: 20점
        - 쿠폰: 20점
        - 새소식: 15점
        """
        score = 0.0
        if has_booking:
            score += 25.0
        if has_talktalk:
            score += 20.0
        if has_smartcall:
            score += 20.0
        if has_coupon:
            score += 20.0
        if has_news:
            score += 15.0
        return min(score, 100.0)

    @staticmethod
    def calculate_engagement_score(
        has_owner_reply: bool,
        has_instagram: bool,
        has_kakao: bool,
        has_menu_description: bool
    ) -> float:
        """
        참여도 점수: 사장님답글(40) + 인스타(20) + 카카오(15) + 메뉴상세설명(25) = 최대 100점
        """
        score = 0.0
        if has_owner_reply:
            score += 40.0
        if has_instagram:
            score += 20.0
        if has_kakao:
            score += 15.0
        if has_menu_description:
            score += 25.0
        return min(score, 100.0)

    @classmethod
    def calculate_total_score(cls, scores: Dict[str, float]) -> float:
        """
        총점 계산 (가중 평균)
        """
        total = 0.0
        total += scores.get("photo", 0) * cls.WEIGHTS["photo"]
        total += scores.get("review", 0) * cls.WEIGHTS["review"]
        total += scores.get("blog", 0) * cls.WEIGHTS["blog"]
        total += scores.get("info", 0) * cls.WEIGHTS["info"]
        total += scores.get("keyword", 0) * cls.WEIGHTS["keyword"]
        total += scores.get("convenience", 0) * cls.WEIGHTS["convenience"]
        total += scores.get("engagement", 0) * cls.WEIGHTS["engagement"]
        return round(total, 1)

    @staticmethod
    def calculate_grade(total_score: float) -> str:
        """
        등급 산출
        A: 80+, B: 60-79, C: 40-59, D: 0-39
        """
        if total_score >= 80:
            return "A"
        elif total_score >= 60:
            return "B"
        elif total_score >= 40:
            return "C"
        else:
            return "D"

    @staticmethod
    def generate_improvement_points(data: Dict[str, Any]) -> List[Dict[str, str]]:
        """
        개선 포인트 자동 생성 (최대 5개)

        Args:
            data: 진단 데이터

        Returns:
            개선 포인트 리스트 [{"category": "photo", "message": "...", "priority": 1}]
        """
        points = []

        # 사진 관련
        photo_count = data.get("photo_count", 0)
        if photo_count == 0:
            points.append({
                "category": "photo",
                "priority": 1,
                "message": "사진이 없습니다. 매장 외관, 내부, 대표 메뉴 사진을 최소 10장 이상 등록하세요.",
            })
        elif photo_count < 5:
            points.append({
                "category": "photo",
                "priority": 2,
                "message": f"사진이 {photo_count}장으로 부족합니다. 다양한 앵글의 사진을 추가로 등록하세요.",
            })
        elif photo_count < 15:
            points.append({
                "category": "photo",
                "priority": 3,
                "message": f"사진 {photo_count}장 등록됨. 15장 이상이면 검색 노출에 유리합니다.",
            })

        # 리뷰 관련
        review_count = data.get("review_count", 0)
        if review_count == 0:
            points.append({
                "category": "review",
                "priority": 1,
                "message": "리뷰가 없습니다. 고객에게 리뷰 작성을 요청하는 안내문을 비치하세요.",
            })
        elif review_count < 10:
            points.append({
                "category": "review",
                "priority": 2,
                "message": f"리뷰가 {review_count}개로 적습니다. 영수증/방문자 리뷰 이벤트를 진행하세요.",
            })
        elif review_count < 30:
            points.append({
                "category": "review",
                "priority": 3,
                "message": f"리뷰 {review_count}개 보유. 30개 이상이면 신뢰도가 크게 상승합니다.",
            })

        # 블로그 리뷰 관련
        blog_count = data.get("blog_review_count", 0)
        if blog_count == 0:
            points.append({
                "category": "blog",
                "priority": 2,
                "message": "블로그 리뷰가 없습니다. 체험단/협찬 마케팅을 고려하세요.",
            })
        elif blog_count < 5:
            points.append({
                "category": "blog",
                "priority": 3,
                "message": f"블로그 리뷰 {blog_count}개. 5개 이상이면 검색 상위 노출에 유리합니다.",
            })

        # 영업시간 관련
        if not data.get("has_hours", False):
            points.append({
                "category": "info",
                "priority": 1,
                "message": "영업시간 정보가 없습니다. 정확한 영업시간을 등록하세요.",
            })

        # 메뉴 관련
        if not data.get("has_menu", False):
            points.append({
                "category": "info",
                "priority": 2,
                "message": "메뉴 정보가 없습니다. 대표 메뉴와 가격을 등록하세요.",
            })

        # 가격 관련
        if not data.get("has_price", False):
            points.append({
                "category": "info",
                "priority": 3,
                "message": "가격 정보가 부족합니다. 메뉴별 가격을 상세히 기재하세요.",
            })

        # 소개글 관련
        if not data.get("has_intro", False):
            points.append({
                "category": "info",
                "priority": 2,
                "message": "매장 소개글을 등록하면 고객에게 매장의 특징과 강점을 어필할 수 있습니다.",
            })

        # 오시는 길 관련
        if not data.get("has_directions", False):
            points.append({
                "category": "info",
                "priority": 3,
                "message": "오시는 길 정보를 등록하면 고객 방문이 편리해집니다.",
            })

        # 키워드 관련
        keywords = data.get("keywords", [])
        total_volume = 0
        for kw in keywords:
            if isinstance(kw, dict):
                total_volume += kw.get("search_volume", 0)
        if total_volume == 0:
            points.append({
                "category": "keyword",
                "priority": 2,
                "message": "키워드 검색량 데이터가 없습니다. 지역명+업종 키워드 전략을 수립하세요.",
            })
        elif total_volume < 1000:
            points.append({
                "category": "keyword",
                "priority": 3,
                "message": "타겟 키워드 검색량이 낮습니다. 더 인기 있는 키워드를 발굴하세요.",
            })

        # 편의기능 관련 (예약/톡톡/스마트콜)
        has_booking = data.get("has_booking", False)
        has_talktalk = data.get("has_talktalk", False)
        has_smartcall = data.get("has_smartcall", False)
        if not has_booking and not has_talktalk:
            points.append({
                "category": "convenience",
                "priority": 2,
                "message": "네이버 예약/톡톡 기능을 활성화하면 고객 문의 및 예약 전환율이 높아집니다.",
            })

        # 쿠폰/새소식 관련
        if not data.get("has_coupon", False) and not data.get("has_news", False):
            points.append({
                "category": "convenience",
                "priority": 3,
                "message": "이벤트/쿠폰을 등록하면 신규 고객 유입에 효과적입니다.",
            })

        # 사장님 답글 관련
        if not data.get("has_owner_reply", False):
            points.append({
                "category": "engagement",
                "priority": 2,
                "message": "최근 리뷰에 사장님 답글을 달면 고객 신뢰도와 재방문율이 상승합니다.",
            })

        # 외부 채널 연동 관련
        has_instagram = data.get("has_instagram", False)
        has_kakao = data.get("has_kakao", False)
        if not has_instagram and not has_kakao:
            points.append({
                "category": "engagement",
                "priority": 3,
                "message": "인스타그램/카카오채널을 연동하면 SNS 마케팅 시너지를 낼 수 있습니다.",
            })

        # 메뉴 상세설명 관련
        if not data.get("has_menu_description", False) and data.get("has_menu", False):
            points.append({
                "category": "engagement",
                "priority": 3,
                "message": "메뉴에 상세 설명(재료, 특징 등)을 추가하면 주문 전환율이 높아집니다.",
            })

        # 우선순위로 정렬하고 최대 5개만 반환
        points.sort(key=lambda x: x["priority"])
        return points[:5]

    @classmethod
    def calculate_all(cls, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        전체 진단 점수 계산

        Args:
            data: 크롤링 결과 데이터

        Returns:
            점수 및 등급, 개선 포인트가 포함된 결과
        """
        # 개별 점수 계산
        photo_score = cls.calculate_photo_score(data.get("photo_count", 0))
        review_score = cls.calculate_review_score(data.get("review_count", 0))
        blog_score = cls.calculate_blog_score(data.get("blog_review_count", 0))
        info_score = cls.calculate_info_score(
            data.get("has_hours", False),
            data.get("has_menu", False),
            data.get("has_price", False),
            data.get("has_intro", False),
            data.get("has_directions", False),
        )
        keyword_score = cls.calculate_keyword_score(data.get("keywords", []))
        convenience_score = cls.calculate_convenience_score(
            data.get("has_booking", False),
            data.get("has_talktalk", False),
            data.get("has_smartcall", False),
            data.get("has_coupon", False),
            data.get("has_news", False),
        )
        engagement_score = cls.calculate_engagement_score(
            data.get("has_owner_reply", False),
            data.get("has_instagram", False),
            data.get("has_kakao", False),
            data.get("has_menu_description", False),
        )

        # 총점 계산
        scores = {
            "photo": photo_score,
            "review": review_score,
            "blog": blog_score,
            "info": info_score,
            "keyword": keyword_score,
            "convenience": convenience_score,
            "engagement": engagement_score,
        }
        total_score = cls.calculate_total_score(scores)

        # 등급 산출
        grade = cls.calculate_grade(total_score)

        # 개선 포인트 생성
        improvement_points = cls.generate_improvement_points(data)

        return {
            "photo_score": photo_score,
            "review_score": review_score,
            "blog_score": blog_score,
            "info_score": info_score,
            "keyword_score": keyword_score,
            "convenience_score": convenience_score,
            "engagement_score": engagement_score,
            "total_score": total_score,
            "grade": grade,
            "improvement_points": improvement_points,
        }
