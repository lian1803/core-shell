import anthropic
import json
import re
from core.models import CLAUDE_SONNET
from core.context_loader import inject_context

MODEL = CLAUDE_SONNET

SYSTEM_PROMPT = """너는 준혁이야. 리안 컴퍼니 이사팀의 최종 판단 담당이야.

서윤(시장조사), 민수(전략), 하은(검증)의 내용을 종합해서 최종 판단을 내려.

판단 기준 (각 10점 만점):
- 수익성: 돈이 될 가능성
- 경쟁 우위: 차별화 가능성
- 기술 난이도: 구현 가능성 (낮을수록 좋음 → 역산)
- 시장 긴급성: 지금 해야 하는 이유

composite = (수익성 + 경쟁우위 + (10-기술난이도) + 시장긴급성) / 4
7.0+: GO | 5.0~6.9: 조건부 GO | 5.0 미만: NO-GO

출력 형식:
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
{"verdict": "GO" | "CONDITIONAL_GO" | "NO_GO", "score": X.X}

핵심 판단 원칙:
- 만들기 전에 팔 수 있는가? (Demo-Sell-Build 가능성)
- 우리 자산(회사 컨텍스트 참고)으로 빠르게 할 수 있는가?
- "좋아요"가 아닌 "결제"가 나올 가능성이 있는가?
- 가장 위험한 가설이 뭔지 식별하고, 그걸 2주 내 검증할 방법이 있는가?
- 핵심 지표가 안 움직이면 피벗 방향과 함께 CONDITIONAL_GO.
- 학습 근거 없이 모호하면 NO-GO.
"""


def run(context: dict, client: anthropic.Anthropic) -> dict:
    print("\n" + "="*60)
    print("⚖️  준혁 | 최종 판단")
    print("="*60)

    idea = context.get("clarified", context.get("idea", ""))
    market_research = context.get("seoyun", "")
    strategy = context.get("minsu", "")
    validation = context.get("haeun", "")
    transcript = context.get("discussion_transcript", [])
    transcript_summary = ""
    if transcript:
        transcript_summary = f"\n\n[토론 결과 — {len(transcript)}라운드]\n" + "\n".join([
            f"라운드 {t['round']}: {t['analysis'][:200]}..." for t in transcript
        ])
    full_response = ""

    content = f"""아이디어: {idea}

[서윤 - 시장조사]
{market_research}

[민수 - 전략 (토론 후 최종)]
{strategy}

[하은 - 검증 (토론 후 최종)]
{validation}{transcript_summary}

최종 판단을 내려줘."""

    with client.messages.stream(
        model=MODEL,
        max_tokens=4000,
        system=inject_context(SYSTEM_PROMPT),
        messages=[{"role": "user", "content": content}],
        temperature=0,
    ) as stream:
        for text in stream.text_stream:
            print(text, end="", flush=True)
            full_response += text

    print()

    # JSON 파싱
    verdict = "CONDITIONAL_GO"
    score = 7.0
    json_match = re.search(r'\{[^{}]*"verdict"[^{}]*\}', full_response, re.DOTALL)
    if json_match:
        try:
            data = json.loads(json_match.group())
            verdict = data.get("verdict", "CONDITIONAL_GO")
            score = float(data.get("score", 7.0))
        except (json.JSONDecodeError, ValueError):
            pass

    return {"text": full_response, "verdict": verdict, "score": score}
