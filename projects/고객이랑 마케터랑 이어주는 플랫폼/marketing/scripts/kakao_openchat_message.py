"""
카카오 오픈채팅 메시지 준비 스크립트
실제 오픈채팅은 API가 없으므로, 메시지를 클립보드에 복사하고
직접 붙여넣는 방식으로 운영합니다.

사용법: python kakao_openchat_message.py
"""

import sys
import os
from datetime import datetime

MESSAGES = [
    {
        "target": "스마트스토어 운영자 모임",
        "timing": "론칭 당일",
        "message": """안녕하세요 여러분 🙏

저 요즘 쇼핑몰 고객 채팅 중에 결제 링크 바로 보낼 수 있는 ChatPay라는 거 써보고 있는데요.

채팅하다가 상품명/금액 입력하면 카카오페이나 토스 결제 링크가 고객 채팅창에 바로 생성돼요. 고객이 클릭해서 결제하면 제 쪽에 알림 오고요.

현재 완전 무료 론칭 중이에요 (chatpay.kr)

제 사이트에 설치하는 데 5분도 안 걸렸어요. 저처럼 계좌이체로 받던 분들한테 진짜 편할 것 같아서 공유해봅니다!""",
    },
    {
        "target": "인스타 쇼핑몰 운영자 모임",
        "timing": "론칭 당일",
        "message": """안녕하세요! 인스타 DM으로 주문받고 계좌이체 처리하시는 분들 계세요?

저 그게 너무 힘들어서 ChatPay 써보기 시작했는데 진짜 편해요.

고객이 채팅으로 "살게요" 하면 → 결제 링크 전송 → 카카오페이/토스 바로 결제 → 알림

지금 무료라서 일단 설치해보시는 거 강추드려요 😊 chatpay.kr""",
    },
    {
        "target": "프리랜서 마케터 모임",
        "timing": "D+3",
        "message": """ChatPay 써보신 분 계세요?

저 며칠째 쓰고 있는데 고객 결제율이 확실히 올라간 것 같아요. 계좌이체는 귀찮아서 그냥 포기하던 분들이 카카오페이로 바로 결제하시더라고요.

무료라서 일단 설치해보시는 거 추천드려요 😊
chatpay.kr에서 무료 가입 가능해요""",
    },
]


def copy_to_clipboard(text: str) -> bool:
    """클립보드에 텍스트 복사 (Windows/Mac/Linux)"""
    try:
        if sys.platform == "win32":
            import subprocess
            process = subprocess.Popen(["clip"], stdin=subprocess.PIPE, close_fds=True)
            process.communicate(text.encode("utf-8"))
        elif sys.platform == "darwin":
            import subprocess
            process = subprocess.Popen(["pbcopy"], stdin=subprocess.PIPE)
            process.communicate(text.encode("utf-8"))
        else:
            import subprocess
            process = subprocess.Popen(["xclip", "-selection", "clipboard"], stdin=subprocess.PIPE)
            process.communicate(text.encode("utf-8"))
        return True
    except Exception as e:
        print(f"클립보드 복사 실패: {e}")
        return False


def main():
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M')}] 오픈채팅 메시지 준비")
    print("=" * 60)
    print("아래 메시지를 해당 오픈채팅방에 직접 붙여넣어 주세요.\n")

    for i, item in enumerate(MESSAGES, 1):
        print(f"[{i}/{len(MESSAGES)}] {item['target']} ({item['timing']})")
        print("-" * 40)
        print(item["message"])
        print("-" * 40)

        # 클립보드에 복사
        if copy_to_clipboard(item["message"]):
            print("✅ 클립보드에 복사됨")

        input("\n[ Enter를 눌러 다음 메시지로 이동 ]")
        print()

    print("모든 메시지 준비 완료!")


if __name__ == "__main__":
    main()
