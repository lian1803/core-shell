import os
import anthropic
from core.models import CLAUDE_SONNET

MODEL = CLAUDE_SONNET

SYSTEM_PROMPT = """너는 리안 컴퍼니 분석·마케팅팀의 영업 전략가 승현이야.

수집된 영업 전문가 자료(SPIN Selling, Challenger Sale, Hook-Story-Offer, 타겟 심리 등)를 전부 읽고,
이 프로젝트의 타겟과 서비스에 맞게 적용해.

절대 하지 마:
- 교과서식 설명
- "이런 방법도 있고 저런 방법도 있어요"
- 두루뭉술한 조언
- 업종/서비스 컨텍스트 무시한 일반론

반드시 해야 할 것:
- 수집된 자료에서 이 업종/서비스에 실제로 먹히는 기법만 골라서 적용
- 타겟 심리와 의사결정 패턴에 맞게 번역
- 구체적 수치, 타이밍, 단어까지 명시
- 재원의 리서치 결과에서 실제 Pain 언어 그대로 활용

출력 형식:
## 핵심 인사이트 (자료 + 리서치 분석)
이 타겟/서비스에 가장 중요한 인사이트 5개 (출처 명시)

## 영업 전략 설계
### 타겟 선별 기준
[1순위 타겟 조건 — 구체적]

### 접촉 전략
[첫 접촉에서 계약까지 각 단계별 전략, 심리 기반]

### 핵심 전환 포인트
[타겟이 "YES" 하게 만드는 결정적 순간과 방법]

### 거절 유형별 처리법
[거절 유형 3~5개 + 각각 대응 스크립트]

## 퍼널 설계
[전환율 최적화된 단계별 플로우, 각 단계 예상 전환율]

## 실행 우선순위
1순위 / 2순위 / 3순위 — 오늘 당장 시작할 것부터"""


def run(context: dict, client: anthropic.Anthropic) -> str:
    print("\n" + "="*60)
    print("⚡ 전략가 | 영업 전략 설계")
    print("="*60)

    research = context.get("research", "")
    industry = context.get("industry", context.get("task", "서비스 미정"))
    target = context.get("target", "타겟 미정")
    current_materials = context.get("current_materials", "")

    user_msg = f"""업종/서비스: {industry}
타겟: {target}

=== 재원 리서치 결과 (타겟 Pain + 경쟟사 + 시장) ===
{research[:6000]}

=== 현재 영업 자료 (있으면) ===
{current_materials[:2000]}

위 자료를 바탕으로 이 타겟/서비스에 맞는 영업 전략을 설계해줘."""

    full_response = ""
    with client.messages.stream(
        model=MODEL,
        max_tokens=3000,
        messages=[
            {"role": "user", "content": user_msg}
        ],
        system=SYSTEM_PROMPT,
    ) as stream:
        for text in stream.text_stream:
            print(text, end="", flush=True)
            full_response += text

    print()
    return full_response
