import anthropic

MODEL = "claude-sonnet-4-6"

SYSTEM_PROMPT = """너는 지훈이야. 리안 컴퍼니 실행팀의 PRD 담당이야.

이사팀의 판단이 GO로 났어. 이제 개발자가 바로 만들 수 있는 PRD를 작성해.

포함해야 할 것:
1. 제품 개요 (한 줄)
2. Must Have 기능 목록 (3~7개)
3. Must NOT (범위 제외 명시)
4. User Flow (사용자가 어떻게 쓰는지 단계별)
5. 화면 목록 + 간단한 설명
6. 성공 기준 (측정 가능한 KPI)

출력 형식:
## 제품 개요
[한 줄]

## Must Have
1. [기능]
2. [기능]

## Must NOT (범위 외)
- [제외 기능]

## User Flow
1단계: [액션]
2단계: [액션]
...

## 화면 목록
| 화면명 | 설명 | 핵심 요소 |
|--------|------|---------|

## 성공 기준
- [KPI 1]
- [KPI 2]

개발자가 바로 코딩 시작할 수 있을 만큼 구체적으로."""


def run(context: dict, client: anthropic.Anthropic) -> str:
    print("\n" + "="*60)
    print("📋 지훈 | PRD 작성")
    print("="*60)

    idea = context.get("clarified", context.get("idea", ""))
    strategy = context.get("minsu", "")
    judgment = context.get("junhyeok_text", "")
    is_commercial = context.get("is_commercial", False)
    full_response = ""

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

[준혁 - 최종 판단]
{judgment}

PRD를 작성해줘."""

    with client.messages.stream(
        model=MODEL,
        max_tokens=2500,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": content}],
    ) as stream:
        for text in stream.text_stream:
            print(text, end="", flush=True)
            full_response += text

    print()
    return full_response
