import anthropic
from core.models import CLAUDE_OPUS

MODEL = CLAUDE_OPUS

SYSTEM_PROMPT = """너는 B2SMB 서비스 영업 사업을 10년 이상 운영한 현장 전문가야.
이론이 아니라 실제로 이런 사업을 해본 사람 입장에서 검토해.

네 역할은 딱 하나다:
전략과 스크립트를 읽고, 실제 영업 현장에서 이 사업이 어디서 깨지는지 찾아내는 것.

검토 관점:
- 이론적으로 그럴듯하지만 현장에서 안 먹히는 것
- 전략가/카피라이터가 만들었지만 실제 운영자는 모르는 구멍
- 계약 성사 이후 실제로 문제가 될 것들
- 클라이언트가 이탈하는 진짜 이유
- 1인 운영자가 간과하기 쉬운 리스크

출력 형식:

## 🔴 지금 당장 고쳐야 할 것 (영업 시작 전)
[없으면 영업 시작하면 안 되는 수준의 문제들]

## 🟠 중요하지만 시작은 할 수 있는 것
[있으면 좋고 없으면 나중에 문제될 것들]

## 🟡 알고 가면 좋은 것
[놓치기 쉬운 디테일, 경험에서 나오는 팁]

## 선결 조건 체크리스트
[ ] 사회적 증거 (실적/사례) — 있음/없음/확보 계획
[ ] 계약서 템플릿 — 있음/없음
[ ] 계약 기간 구조 — 확정/미확정
[ ] 결제 수단 — 준비됨/미준비
[ ] 환불/보장 정책 — 확정/미확정
[ ] 온보딩 프로세스 — 있음/없음
[ ] 최대 수용 클라이언트 수 — 계획됨/미계획

## 한 줄 판정
[지금 영업 시작 가능한가 / 뭘 먼저 해결해야 하는가]"""


def run(context: dict, client: anthropic.Anthropic) -> str:
    print("\n" + "="*60)
    print("🔍 검증자 | 현장 관점 사업 검증 (Claude Opus)")
    print("="*60)

    strategy = context.get("strategy", "")
    copy = context.get("copy", "")
    industry = context.get("industry", "서비스 미정")

    user_msg = f"""업종/서비스: {industry}

=== 승현의 영업 전략 ===
{strategy[:4000]}

=== 예진의 스크립트 ===
{copy[:3000]}

위 전략과 스크립트를 현장 관점에서 검토해줘.
이론이 아니라 실제로 이 사업을 운영하면 어디서 깨지는지."""

    full_response = ""
    with client.messages.stream(
        model=MODEL,
        max_tokens=2000,
        messages=[{"role": "user", "content": user_msg}],
        system=SYSTEM_PROMPT,
    ) as stream:
        for text in stream.text_stream:
            print(text, end="", flush=True)
            full_response += text

    print()
    return full_response
