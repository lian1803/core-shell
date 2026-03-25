"""
api/keyword_api.py — 네이버 검색광고 API (키워드 통계)
"""
import sys
import os
import time
import hmac
import hashlib
import base64
from typing import Dict, Any, List

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

import httpx

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import (
    NAVER_AD_CUSTOMER_ID,
    NAVER_AD_ACCESS_LICENSE,
    NAVER_AD_SECRET_KEY,
    log,
)


def _make_ad_headers(method: str, path: str) -> Dict[str, str]:
    """네이버 광고 API HMAC 서명 헤더 생성"""
    timestamp = str(int(time.time() * 1000))
    message = f"{timestamp}.{method}.{path}"
    secret_bytes = NAVER_AD_SECRET_KEY.encode("utf-8")
    message_bytes = message.encode("utf-8")
    sig = hmac.new(secret_bytes, message_bytes, hashlib.sha256).digest()
    signature = base64.b64encode(sig).decode("utf-8")
    return {
        "Content-Type": "application/json; charset=UTF-8",
        "X-Timestamp": timestamp,
        "X-API-KEY": NAVER_AD_ACCESS_LICENSE,
        "X-Customer": NAVER_AD_CUSTOMER_ID,
        "X-Signature": signature,
    }


def _parse_qcnt(val) -> int:
    """검색량 파싱 (< 10 처리 포함)"""
    if val == "< 10":
        return 5
    try:
        return int(val)
    except Exception:
        return 0


async def get_keyword_stats(keyword: str) -> Dict[str, Any]:
    """키워드 월간 검색량 + 연관 키워드 조회"""
    path = "/keywordstool"
    # 네이버 광고 API는 공백 포함 키워드를 hintKeywords에서 거부함 (400 오류)
    # 공백 제거 버전으로 조회 후 원본 키워드도 시도
    keyword_nospace = keyword.replace(" ", "")
    params = {"hintKeywords": keyword_nospace, "showDetail": "1"}
    headers = _make_ad_headers("GET", path)

    default = {"pc": 0, "mobile": 0, "total": 0, "related": []}

    try:
        async with httpx.AsyncClient(follow_redirects=True) as client:
            resp = await client.get(
                f"https://api.naver.com{path}",
                headers=headers,
                params=params,
                timeout=10.0,
            )
            data = resp.json()

        keywords_list = data.get("keywordList", [])
        if not keywords_list:
            log("KeywordAPI", f"'{keyword}' 결과 없음")
            return default

        # 정확히 일치하는 키워드 우선 선택
        main = next(
            (k for k in keywords_list if k.get("relKeyword") == keyword),
            keywords_list[0]
        )
        pc = _parse_qcnt(main.get("monthlyPcQcCnt", 0))
        mobile = _parse_qcnt(main.get("monthlyMobileQcCnt", 0))

        # 연관 키워드 목록 (검색량 > 0)
        related: List[Dict] = []
        for k in keywords_list[:10]:
            kw_name = k.get("relKeyword", "")
            kw_mobile = _parse_qcnt(k.get("monthlyMobileQcCnt", 0))
            if kw_name and kw_mobile > 0:
                related.append({"keyword": kw_name, "mobile": kw_mobile})

        related.sort(key=lambda x: x["mobile"], reverse=True)
        log("KeywordAPI", f"'{keyword}': PC={pc:,}, 모바일={mobile:,}, 연관={len(related)}개")

        return {
            "pc": pc,
            "mobile": mobile,
            "total": pc + mobile,
            "related": related[:7],
        }

    except Exception as e:
        log("KeywordAPI", f"오류: {e}")
        return default
