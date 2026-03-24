"""
ChatPay 마케팅 성과 수집 스크립트
3일마다 실행하여 채널별 성과를 수집하고 보고서 생성

필요 설정:
- IG_ACCESS_TOKEN: 인스타그램 비즈니스 계정 토큰
- CHATPAY_API_URL: chatpay.kr API URL
- CHATPAY_ADMIN_TOKEN: 관리자 토큰 (통계 조회용)

사용법: python performance_tracker.py
"""

import os
import json
import urllib.request
from datetime import datetime, timedelta

IG_ACCESS_TOKEN = os.environ.get("IG_ACCESS_TOKEN", "")
IG_USER_ID = os.environ.get("IG_USER_ID", "")
CHATPAY_API_URL = os.environ.get("CHATPAY_API_URL", "http://localhost:3000")
CHATPAY_ADMIN_TOKEN = os.environ.get("CHATPAY_ADMIN_TOKEN", "")

GRAPH_API = "https://graph.facebook.com/v18.0"


def get_ig_insights() -> dict:
    """인스타그램 인사이트 조회"""
    if not IG_ACCESS_TOKEN or not IG_USER_ID:
        return {"error": "IG credentials not set", "impressions": 0, "reach": 0, "profile_views": 0}

    try:
        metrics = "impressions,reach,profile_views"
        period = "day"
        url = f"{GRAPH_API}/{IG_USER_ID}/insights?metric={metrics}&period={period}&access_token={IG_ACCESS_TOKEN}"
        with urllib.request.urlopen(url) as res:
            data = json.loads(res.read().decode("utf-8"))
            result = {}
            for item in data.get("data", []):
                result[item["name"]] = item["values"][-1]["value"] if item["values"] else 0
            return result
    except Exception as e:
        return {"error": str(e)}


def get_chatpay_stats() -> dict:
    """ChatPay 회원가입 및 사용 통계 조회"""
    if not CHATPAY_ADMIN_TOKEN:
        return {"error": "Admin token not set", "total_users": 0, "new_users_today": 0}

    try:
        req = urllib.request.Request(
            f"{CHATPAY_API_URL}/admin/stats",
            headers={"Authorization": f"Bearer {CHATPAY_ADMIN_TOKEN}"},
        )
        with urllib.request.urlopen(req) as res:
            return json.loads(res.read().decode("utf-8"))
    except Exception as e:
        return {"error": str(e)}


def generate_report(ig_data: dict, chatpay_data: dict) -> str:
    """성과 보고서 생성"""
    today = datetime.now().strftime("%Y-%m-%d")

    report = f"""
=====================================
ChatPay 마케팅 성과 보고서
날짜: {today}
=====================================

[인스타그램]
- 노출수: {ig_data.get('impressions', 'N/A')}
- 도달수: {ig_data.get('reach', 'N/A')}
- 프로필 방문: {ig_data.get('profile_views', 'N/A')}
{f"- 오류: {ig_data.get('error')}" if 'error' in ig_data else ""}

[ChatPay 서비스]
- 전체 가입자: {chatpay_data.get('total_users', 'N/A')}
- 오늘 신규 가입: {chatpay_data.get('new_users_today', 'N/A')}
- 워크스페이스 생성: {chatpay_data.get('total_workspaces', 'N/A')}
- 총 채팅 수: {chatpay_data.get('total_chats', 'N/A')}
- 총 결제 링크: {chatpay_data.get('total_payment_links', 'N/A')}
{f"- 오류: {chatpay_data.get('error')}" if 'error' in chatpay_data else ""}

=====================================
[Action Item]
"""

    # 자동 액션 아이템 생성
    new_users = chatpay_data.get("new_users_today", 0)
    if isinstance(new_users, int):
        if new_users < 5:
            report += "⚠️  신규 가입자 부족 → 오픈채팅 추가 공유 필요\n"
        elif new_users < 20:
            report += "✅  성장 중 → 현재 채널 유지\n"
        else:
            report += "🚀  가입자 급증 → 서버 상태 모니터링 필요\n"
    else:
        report += "- 데이터 수집 후 판단 필요\n"

    report += "=====================================\n"
    return report


def save_report(report: str):
    """보고서를 파일로 저장"""
    os.makedirs("reports", exist_ok=True)
    filename = f"reports/performance_{datetime.now().strftime('%Y%m%d_%H%M')}.txt"
    with open(filename, "w", encoding="utf-8") as f:
        f.write(report)
    print(f"보고서 저장됨: {filename}")


def main():
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M')}] 성과 수집 시작")
    print("=" * 50)

    print("인스타그램 인사이트 조회 중...")
    ig_data = get_ig_insights()

    print("ChatPay 통계 조회 중...")
    chatpay_data = get_chatpay_stats()

    report = generate_report(ig_data, chatpay_data)
    print(report)
    save_report(report)


if __name__ == "__main__":
    main()
