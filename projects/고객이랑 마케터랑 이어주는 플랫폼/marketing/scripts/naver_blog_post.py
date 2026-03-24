"""
네이버 블로그 자동 포스팅 스크립트
사용법: python naver_blog_post.py

필요 설정:
- NAVER_CLIENT_ID: 네이버 API 앱의 Client ID
- NAVER_CLIENT_SECRET: 네이버 API 앱의 Client Secret
- NAVER_BLOG_ID: 블로그 아이디 (xxx.blog.me에서 xxx 부분)

네이버 블로그 Open API: https://developers.naver.com/docs/blog/post/
"""

import os
import urllib.request
import urllib.parse
import json
from datetime import datetime

NAVER_CLIENT_ID = os.environ.get("NAVER_CLIENT_ID", "YOUR_CLIENT_ID")
NAVER_CLIENT_SECRET = os.environ.get("NAVER_CLIENT_SECRET", "YOUR_CLIENT_SECRET")

BLOG_POSTS = [
    {
        "title": "쇼핑몰 운영하면서 고객 결제 처리 이렇게 힘드셨죠? (무료 툴 공유)",
        "content": """
<p>안녕하세요, 쇼핑몰 운영 4년차입니다.</p>

<p>저는 작년까지 고객이 "이거 살게요!"라고 하면 계좌번호를 일일이 알려주고 입금 확인을 기다렸어요.</p>
<p>그 사이 고객이 사라지는 일이 한두 번이 아니었습니다.</p>

<p>그러다가 최근에 발견한 게 <strong>ChatPay</strong>인데요.</p>
<p>채팅 도중에 결제 링크를 바로 보낼 수 있어요.<br>
고객은 링크 클릭 → 카카오페이 또는 토스로 바로 결제.<br>
결제 완료되면 제 채팅창에 즉시 알림!</p>

<p>무엇보다 <strong>지금 완전 무료</strong>입니다.</p>

<p>→ <a href="https://chatpay.kr">chatpay.kr</a> (무료 가입)</p>

<p>나중에 유료 전환될 수 있다고 하는데 얼리어답터로 지금 쓰는 게 이득인 것 같아요.</p>

<p>#쇼핑몰운영 #채팅결제 #카카오페이 #고객응대 #스마트스토어</p>
""",
        "tags": "쇼핑몰운영,채팅결제,카카오페이,고객응대,스마트스토어,ChatPay",
    },
]


def post_to_naver_blog(title: str, content: str, tags: str) -> dict:
    """네이버 블로그 API로 포스팅"""
    url = "https://openapi.naver.com/blog/writePost.json"

    data = urllib.parse.urlencode({
        "blogId": os.environ.get("NAVER_BLOG_ID", ""),
        "title": title,
        "contents": content,
        "tags": tags,
        "categoryNo": "0",
    }).encode("utf-8")

    request = urllib.request.Request(url, data=data, method="POST")
    request.add_header("X-Naver-Client-Id", NAVER_CLIENT_ID)
    request.add_header("X-Naver-Client-Secret", NAVER_CLIENT_SECRET)
    request.add_header("Content-Type", "application/x-www-form-urlencoded")

    try:
        with urllib.request.urlopen(request) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        print(f"HTTP Error: {e.code} - {e.reason}")
        print(e.read().decode("utf-8"))
        return {"error": str(e)}


def main():
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M')}] 네이버 블로그 포스팅 시작")
    print("=" * 50)

    if NAVER_CLIENT_ID == "YOUR_CLIENT_ID":
        print("⚠️  환경변수 설정 필요:")
        print("  export NAVER_CLIENT_ID=your_client_id")
        print("  export NAVER_CLIENT_SECRET=your_client_secret")
        print("  export NAVER_BLOG_ID=your_blog_id")
        print()
        print("[DRY RUN] 실제 전송 없이 내용 출력:")
        for post in BLOG_POSTS:
            print(f"\n제목: {post['title']}")
            print(f"태그: {post['tags']}")
        return

    for i, post in enumerate(BLOG_POSTS, 1):
        print(f"\n[{i}/{len(BLOG_POSTS)}] 포스팅: {post['title'][:30]}...")
        result = post_to_naver_blog(post["title"], post["content"], post["tags"])
        if "error" in result:
            print(f"❌ 실패: {result['error']}")
        else:
            print(f"✅ 성공: {result}")

    print("\n완료!")


if __name__ == "__main__":
    main()
