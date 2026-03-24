import os
import requests
from datetime import datetime
from .base import MarketBase, Order, Inquiry


class NaverMarket(MarketBase):
    BASE_URL = "https://api.commerce.naver.com/external"
    TOKEN_URL = "https://api.commerce.naver.com/external/v1/oauth2/token"

    def __init__(self):
        self.client_id = os.getenv("NAVER_CLIENT_ID")
        self.client_secret = os.getenv("NAVER_CLIENT_SECRET")
        self._token = None

    def _get_token(self) -> str:
        """OAuth 토큰 발급"""
        # TODO: API 키 발급 후 실제 구현
        # POST /v1/oauth2/token
        raise NotImplementedError("네이버 API 키 필요")

    def get_new_orders(self) -> list[Order]:
        # TODO: API 키 발급 후 실제 구현
        # GET /v1/pay-order/seller/orders/new-pay-orders
        raise NotImplementedError("네이버 API 키 필요")

    def get_inquiries(self) -> list[Inquiry]:
        # TODO: API 키 발급 후 실제 구현
        # GET /v1/seller/inquiry-answers
        raise NotImplementedError("네이버 API 키 필요")

    def reply_inquiry(self, inquiry_id: str, message: str) -> bool:
        # TODO: API 키 발급 후 실제 구현
        raise NotImplementedError("네이버 API 키 필요")
