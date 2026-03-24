from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime


@dataclass
class Order:
    market: str          # 어디서 온 주문 (coupang / naver / 11st)
    order_id: str        # 마켓 주문번호
    product_name: str    # 상품명
    product_id: str      # 상품번호 (소싱 연결용)
    quantity: int        # 수량
    buyer_name: str      # 구매자
    status: str          # 주문상태
    ordered_at: datetime # 주문시각


@dataclass
class Inquiry:
    market: str
    inquiry_id: str
    order_id: str
    question: str
    answered: bool


class MarketBase(ABC):
    """모든 마켓이 구현해야 하는 공통 인터페이스"""

    @abstractmethod
    def get_new_orders(self) -> list[Order]:
        """신규 주문 가져오기"""
        pass

    @abstractmethod
    def get_inquiries(self) -> list[Inquiry]:
        """미답변 문의 가져오기"""
        pass

    @abstractmethod
    def reply_inquiry(self, inquiry_id: str, message: str) -> bool:
        """문의 답변 보내기"""
        pass
