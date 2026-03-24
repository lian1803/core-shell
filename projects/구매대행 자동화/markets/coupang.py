import hmac
import hashlib
import os
from datetime import datetime, timezone
from .base import MarketBase, Order, Inquiry


class CoupangMarket(MarketBase):
    BASE_URL = "https://api-gateway.coupang.com"

    def __init__(self):
        self.access_key = os.getenv("COUPANG_ACCESS_KEY")
        self.secret_key = os.getenv("COUPANG_SECRET_KEY")
        self.vendor_id = os.getenv("COUPANG_VENDOR_ID")

    def _make_auth_header(self, method: str, path: str) -> dict:
        """쿠팡 HMAC 인증 헤더 생성"""
        datetime_str = datetime.now(timezone.utc).strftime("%y%m%dT%H%M%SZ")
        message = datetime_str + method + path
        signature = hmac.new(
            self.secret_key.encode(), message.encode(), hashlib.sha256
        ).hexdigest()
        return {
            "Authorization": f"CEA algorithm=HmacSHA256, access-key={self.access_key}, signed-date={datetime_str}, signature={signature}",
            "Content-Type": "application/json",
        }

    def get_new_orders(self) -> list[Order]:
        # TODO: API 키 발급 후 실제 구현
        # GET /v2/providers/openapi/apis/api/v4/vendors/{vendorId}/ordersheets
        raise NotImplementedError("쿠팡 API 키 필요")

    def get_inquiries(self) -> list[Inquiry]:
        # TODO: API 키 발급 후 실제 구현
        raise NotImplementedError("쿠팡 API 키 필요")

    def reply_inquiry(self, inquiry_id: str, message: str) -> bool:
        # TODO: API 키 발급 후 실제 구현
        raise NotImplementedError("쿠팡 API 키 필요")
