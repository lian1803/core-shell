import anthropic
import json
import re
from core.models import CLAUDE_SONNET
from core.context_loader import inject_context

MODEL = CLAUDE_SONNET

SYSTEM_PROMPT = """너는 준혁이야. 리안 컴퍼니 이사팀의 최종 판단 담당이야.

서윤(시장조사), 민수(전략), 하은(검증)의 내용을 종합해서 최종 판단을 내려.

판단 기준 (각 10점 만점):
- 수익성: 돈이 될 가능성 — **비즈니스 모델 유형에 따라 다르게 채점**
  - 광고/미디어/트래픽 모델: 트래픽 천장값과 광고 단가 곱으로 잠재 수익 계산. 단기 현금흐름 없는 게 당연 → 단기 수익 없다고 낮게 주지 말 것
  - SaaS/구독: 초기 LTV × 전환율로 계산
  - 대행/서비스: 첫 계약 예상 금액 × 클로징 확률
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
- 아이디어를 **그 자체로** 평가해라. 기존 사업(오프라인 영업, naver-diagnosis 등)과 비교하거나 "기존 것보다 돈까지 거리가 멀다"는 이유로 NO-GO 내리지 마라. 독립 실험은 독립 실험으로 평가한다.
- 비즈니스 유형에 따라 검증 기간이 다르다:
  - SaaS/구독: 2~4주 내 첫 결제 가능
  - 광고/미디어: 3~6개월 트래픽 축적 필요 → "2주 검증" 기준 적용 금지
  - 대행/서비스: 1~2주 내 첫 계약 가능
- 만들기 전에 팔 수 있는가? (Demo-Sell-Build 가능성)
- "좋아요"가 아닌 "결제 또는 사용"이 나올 가능성이 있는가?
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

    try:
        with client.messages.stream(
            model=MODEL,
            max_tokens=4000,
            system=inject_context(SYSTEM_PROMPT),
            messages=[{"role": "user", "content": content}],
            temperature=0,
            timeout=180,
        ) as stream:
            for text in stream.text_stream:
                print(text, end="", flush=True)
                full_response += text

        print()
    except Exception as e:
        error_msg = f"[준혁 판단 실패: {str(e)[:100]}]"
        print(f"\n⚠️  {error_msg}")
        full_response = error_msg

    # JSON 파싱
    verdict = "REVIEW_NEEDED"
    score = 5.0

    json_match = re.search(r'\{[^{}]*"verdict"[^{}]*\}', full_response, re.DOTALL)
    if json_match:
        try:
            data = json.loads(json_match.group())
            verdict = data.get("verdict", "REVIEW_NEEDED")
            score = float(data.get("score", 5.0))
        except (json.JSONDecodeError, ValueError):
            # JSON 파싱 실패 시 키워드 검색 (구체적 판단)
            # NO-GO 관련 키워드 우선 검색
            no_go_keywords = ["NO_GO", "NO-GO", "노고", "비추천", "실행금지"]
            go_keywords = ["GO", "GO자"]

            found_no_go = any(kw in full_response.upper() for kw in no_go_keywords)
            found_go = any(kw in full_response.upper() for kw in go_keywords)

            if found_no_go:
                verdict = "NO_GO"
                score = 3.0
            elif found_go and not found_no_go:
                verdict = "GO"
                score = 8.0
            else:
                # 둘 다 불명확하면 REVIEW_NEEDED (자동 GO 절대 금지)
                verdict = "REVIEW_NEEDED"
                score = 5.0

    return {"text": full_response, "verdict": verdict, "score": score}
