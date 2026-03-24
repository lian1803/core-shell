"""
인스타그램 콘텐츠 스케줄러
Meta Graph API를 사용하여 인스타그램 게시물을 예약 발행합니다.

필요 설정:
- IG_ACCESS_TOKEN: 인스타그램 비즈니스 계정 액세스 토큰
- IG_USER_ID: 인스타그램 사용자 ID
- 릴스 영상은 별도로 촬영/편집 후 URL 제공 필요

사용법:
  export IG_ACCESS_TOKEN=your_token
  export IG_USER_ID=your_user_id
  python instagram_scheduler.py
"""

import os
import json
import urllib.request
import urllib.parse
from datetime import datetime

IG_ACCESS_TOKEN = os.environ.get("IG_ACCESS_TOKEN", "YOUR_ACCESS_TOKEN")
IG_USER_ID = os.environ.get("IG_USER_ID", "YOUR_USER_ID")
GRAPH_API_URL = "https://graph.facebook.com/v18.0"

POSTS = [
    {
        "type": "caption_only",
        "caption": """인스타 쇼핑몰 운영하면서 결제 처리가 제일 힘들었는데 이거 쓰고 나서 진짜 달라짐 😮‍💨

고객이랑 채팅하다가 결제 링크 바로 전송 → 카카오페이/토스 결제 → 알림까지 자동

지금 완전 무료 론칭 중 (나중에 유료 될 수 있음!)

👉 프로필 링크에서 무료 가입 (chatpay.kr)

#인스타쇼핑몰 #쇼핑몰운영 #채팅결제 #카카오페이 #스마트스토어 #온라인쇼핑몰 #사업자 #프리랜서마케터 #쇼핑몰창업 #부업 #자동화 #ChatPay""",
        "note": "이미지/릴스 URL이 없을 경우 캡션만 출력됨",
    },
    {
        "type": "caption_only",
        "caption": """ChatPay 기능 3가지 정리 📌

1️⃣ 위젯 설치 → 내 사이트에 채팅 버튼 추가 (5분)
2️⃣ 채팅 중 결제 링크 전송 (카카오페이/토스)
3️⃣ 결제 완료 실시간 알림

쇼핑몰 운영자, 프리랜서 분들 강추
현재 완전 무료 ✅ → chatpay.kr

#쇼핑몰운영팁 #자동화 #채팅결제 #카카오페이링크 #ChatPay""",
        "note": "D+3 발행 예정",
    },
]


def create_ig_post(caption: str, image_url: str = None) -> dict:
    """인스타그램 포스트 생성 (이미지 포함)"""
    if not image_url:
        print("[DRY RUN] 이미지 URL 없음 — 캡션만 출력")
        return {"dry_run": True, "caption": caption[:50] + "..."}

    # 1단계: 미디어 컨테이너 생성
    container_url = f"{GRAPH_API_URL}/{IG_USER_ID}/media"
    data = urllib.parse.urlencode({
        "image_url": image_url,
        "caption": caption,
        "access_token": IG_ACCESS_TOKEN,
    }).encode("utf-8")

    try:
        req = urllib.request.Request(container_url, data=data, method="POST")
        with urllib.request.urlopen(req) as res:
            container = json.loads(res.read().decode("utf-8"))

        # 2단계: 게시물 발행
        publish_url = f"{GRAPH_API_URL}/{IG_USER_ID}/media_publish"
        pub_data = urllib.parse.urlencode({
            "creation_id": container["id"],
            "access_token": IG_ACCESS_TOKEN,
        }).encode("utf-8")

        req2 = urllib.request.Request(publish_url, data=pub_data, method="POST")
        with urllib.request.urlopen(req2) as res2:
            return json.loads(res2.read().decode("utf-8"))

    except Exception as e:
        return {"error": str(e)}


def main():
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M')}] 인스타그램 콘텐츠 스케줄러")
    print("=" * 60)

    if IG_ACCESS_TOKEN == "YOUR_ACCESS_TOKEN":
        print("⚠️  환경변수 설정 필요:")
        print("  export IG_ACCESS_TOKEN=your_access_token")
        print("  export IG_USER_ID=your_user_id")
        print()
        print("[DRY RUN] 발행 예정 캡션 목록:")
        for i, post in enumerate(POSTS, 1):
            print(f"\n[{i}] {post.get('note', '')}")
            print(post["caption"][:100] + "...")
        return

    for i, post in enumerate(POSTS, 1):
        print(f"\n[{i}/{len(POSTS)}] 게시물 발행 중...")
        result = create_ig_post(post["caption"])
        if "error" in result:
            print(f"❌ 실패: {result['error']}")
        elif "dry_run" in result:
            print("✅ DRY RUN 완료")
        else:
            print(f"✅ 성공: {result}")

    print("\n완료!")


if __name__ == "__main__":
    main()
