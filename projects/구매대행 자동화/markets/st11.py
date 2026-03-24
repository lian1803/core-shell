import os
from datetime import datetime
from .base import MarketBase, Order, Inquiry


class St11Market(MarketBase):
    BASE_URL = "https://openapi.11st.co.kr/openapi/OpenApiService.tmall"

    def __init__(self):
        self.api_key = os.getenv("ST11_API_KEY")

    def get_new_orders(self) -> list[Order]:
        # TODO: API 키 발급 후 실제 구현
        raise NotImplementedError("11번가 API 키 필요")

    def get_inquiries(self) -> list[Inquiry]:
        # TODO: API 키 발급 후 실제 구현
        raise NotImplementedError("11번가 API 키 필요")

    def reply_inquiry(self, inquiry_id: str, message: str) -> bool:
        # TODO: API 키 발급 후 실제 구현
        raise NotImplementedError("11번가 API 키 필요")
