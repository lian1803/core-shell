import re
import anthropic
from core.models import CLAUDE_SONNET

MODEL = CLAUDE_SONNET


def _safe(text: str) -> str:
    return re.sub(r'[\ud800-\udfff]', '', str(text))

SYSTEM_PROMPT = """너는 지훈이야. 리안 컴퍼니 실행팀의 PRD 담당이야.

이사팀의 판단이 GO로 났어. 이제 개발자가 바로 만들 수 있는 PRD를 작성해.

MetaGPT WritePRD 수준의 구체성이 목표야. 개발자가 이 문서 하나로 바로 코딩 시작할 수 있어야 해.

포함해야 할 것:
1. 제품 개요 (한 줄)
2. Must Have 기능 목록 (3~7개)
3. Must NOT (범위 제외 명시)
4. User Flow (사용자 시나리오 단계별)
5. 화면 명세 (화면별 컴포넌트 + 동작)
6. API 명세 (엔드포인트 + 요청/응답 구조)
7. 데이터 모델 (핵심 테이블/컬렉션 + 필드)
8. 성공 기준 (측정 가능한 KPI)

출력 형식:
## 제품 개요
[한 줄]

## Must Have
1. [기능] — [이유]
2. [기능] — [이유]

## Must NOT (범위 외)
- [제외 기능] — [이유]

## User Flow
[주요 시나리오 이름]
1단계: [사용자 액션] → [시스템 응답]
2단계: ...

## 화면 명세
| 화면명 | URL/Route | 핵심 컴포넌트 | 동작 |
|--------|-----------|-------------|------|

## API 명세
| Method | Endpoint | 요청 Body | 응답 | 인증 |
|--------|---------|-----------|------|------|

## 데이터 모델
### [테이블/컬렉션명]
| 필드 | 타입 | 설명 | 제약 |
|------|------|------|------|

## 성공 기준
- [KPI 1]: [측정 방법]
- [KPI 2]: [측정 방법]

## 리스크
- [하은 반론 기반 리스크]: [대응 방안]

개발자가 바로 코딩 시작할 수 있을 만큼 구체적으로. 모호한 표현 금지."""


def run(context: dict, client: anthropic.Anthropic) -> str:
    print("\n" + "="*60)
    print("📋 지훈 | PRD 작성")
    print("="*60)

    idea = context.get("clarified", context.get("idea", ""))
    strategy = context.get("minsu", "")
    judgment = context.get("junhyeok_text", "")
    haeun = context.get("haeun", "")
    is_commercial = context.get("is_commercial", False)
    full_response = ""

    idea = _safe(idea)
    strategy = _safe(strategy)
    judgment = _safe(judgment)
    haeun = _safe(haeun)

    feedback = context.get("lian_feedback", "")
    previous_prd = context.get("previous_prd", "")

    if feedback and previous_prd:
        content = f"""[이전 PRD]
{previous_prd}

[리안 피드백]
{feedback}

위 피드백을 반영해서 PRD를 수정해줘. 피드백과 관련 없는 부분은 그대로 유지해."""
    else:
        content = f"""아이디어: {idea}
유형: {"상용화 서비스" if is_commercial else "개인 툴"}

[민수 - 전략]
{strategy}

[하은 - 검증/반론]
{haeun}

[준혁 - 최종 판단]
{judgment}

PRD를 작성해줘. 하은의 반론을 PRD의 리스크 섹션에 반드시 반영해."""

    with client.messages.stream(
        model=MODEL,
        max_tokens=2500,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": content}],
        temperature=0.3,
    ) as stream:
        for text in stream.text_stream:
            print(text, end="", flush=True)
            full_response += text

    print()
    return full_response
