import anthropic
import json
import re

MODEL = "claude-opus-4-6"

SYSTEM_PROMPT = """너는 준혁이야. 리안 컴퍼니 이사팀의 최종 판단 담당이야. Opus 급 판단력을 가지고 있어.

서윤(시장조사), 민수(전략), 하은(검증) 의 내용을 종합해서 최종 판단을 내려.

판단 기준 (각 10점 만점):
- 수익성: 돈이 될 가능성
- 경쟁 우위: 차별화 가능성
- 기술 난이도: 구현 가능성 (낮을수록 좋음 → 역산)
- 시장 긴급성: 지금 해야 하는 이유

composite 점수 = (수익성 + 경쟁우위 + (10-기술난이도) + 시장긴급성) / 4

7.0 이상: GO
5.0~6.9: 조건부 GO (조건 명시)
5.0 미만: NO-GO (대안 제시)

출력 형식 (반드시 이 순서대로):
## 종합 평가
| 항목 | 점수 | 근거 |
|------|------|------|
| 수익성 | X/10 | |
| 경쟁 우위 | X/10 | |
| 기술 난이도 | X/10 | |
| 시장 긴급성 | X/10 | |
| **Composite** | **X.X** | |

## 최종 판단: GO / 조건부 GO / NO-GO

## 판단 근거
[3줄 이내]

## 조건 또는 주의사항
[있으면 작성]

## 다음 단계
GO면: "실행팀으로 넘길게."
NO-GO면: "이 방향은 재검토 필요. 대안: [제안]"

마지막 줄에 반드시 JSON으로:
{"verdict": "GO" | "CONDITIONAL_GO" | "NO_GO", "score": X.X}"""


def run(context: dict, client: anthropic.Anthropic) -> dict:
    print("\n" + "="*60)
    print("⚖️  준혁 | 최종 판단")
    print("="*60)

    idea = context.get("clarified", context.get("idea", ""))
    market_research = context.get("seoyun", "")
    strategy = context.get("minsu", "")
    validation = context.get("haeun", "")
    full_response = ""

    content = f"""아이디어: {idea}

[서윤 - 시장조사]
{market_research}

[민수 - 전략]
{strategy}

[하은 - 검증]
{validation}

최종 판단을 내려줘."""

    with client.messages.stream(
        model=MODEL,
        max_tokens=2000,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": content}],
    ) as stream:
        for text in stream.text_stream:
            print(text, end="", flush=True)
            full_response += text

    print()

    # JSON 파싱
    verdict = "GO"
    score = 7.0
    json_match = re.search(r'\{[^{}]*"verdict"[^{}]*\}', full_response, re.DOTALL)
    if json_match:
        try:
            data = json.loads(json_match.group())
            verdict = data.get("verdict", "GO")
            score = float(data.get("score", 7.0))
        except (json.JSONDecodeError, ValueError):
            pass

    return {"text": full_response, "verdict": verdict, "score": score}
