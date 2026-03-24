"""
소싱 연결 모듈
불사자 프로그램 로직이 여기 들어옴
"""


def get_sourcing_url(product_id: str) -> str:
    """
    제품번호 → 소싱 URL 반환
    TODO: 불사자 프로그램 로직 여기에 연결
    """
    # 임시: 1688 직접 검색 링크
    return f"https://s.1688.com/selloffer/offer_search.htm?keywords={product_id}"


def auto_source(product_id: str, quantity: int) -> dict:
    """
    제품번호 + 수량 → 소싱 결과 반환
    TODO: 불사자 연결 후 자동 장바구니 담기까지 구현
    """
    return {
        "product_id": product_id,
        "quantity": quantity,
        "sourcing_url": get_sourcing_url(product_id),
        "status": "manual_required",  # 자동화 전까지 수동
    }
