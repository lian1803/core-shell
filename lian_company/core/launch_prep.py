"""
launch_prep.py — Layer 3: 런칭 준비 파이프라인

GO 판정 후, 개발/실행 전에 돌리는 단계.
"누구한테 뭘 얼마에 어떻게 팔건데?" 를 구체화한다.

사용법:
    from core.launch_prep import run_launch_prep
    result = run_launch_prep(context, client)

또는 직접 실행:
    python -m core.launch_prep "프로젝트 설명"
"""
import os
import anthropic
from dotenv import load_dotenv
from core.context_loader import inject_context
from core.research_loop import research_before_task
from core.models import CLAUDE_SONNET

load_dotenv()

MODEL = CLAUDE_SONNET

LAUNCH_PREP_PROMPT = """너는 시은이야. 이사팀 GO 판정이 났고, 이제 런칭 준비를 해야 해.

개발/실행에 들어가기 전에 반드시 이것들을 구체화해야 해:

1. **타겟 구체화** — "소상공인"이 아니라 "월매출 500만 이상 네이버 스마트스토어 셀러" 수준으로
2. **경쟁사 상품/가격** — 실제 대행사들이 뭘 얼마에 파는지 (리서치 결과 참고)
3. **우리 상품 정의** — 우리가 팔 것 + 가격 + 포함 내용
4. **영업 채널** — DM? 이메일? 광고? 각 채널의 자동화 가능 여부 + 법적 제한
5. **마케팅 채널** — 인스타 컨셉, 블로그 플랫폼, 광고 예산
6. **첫 주 액션플랜** — 런칭 후 첫 7일 동안 매일 뭘 할건지

출력 형식:
## 1. 타겟
| 항목 | 내용 |
|------|------|
| 구체적 타겟 | |
| 타겟이 모이는 곳 | |
| 예상 TAM | |
| 얼리어답터 특성 | |

## 2. 경쟁사 벤치마크
| 경쟁사 | 상품 | 가격 | 우리 대비 약점 |
|--------|------|------|--------------|

## 3. 우리 상품
| 플랜 | 가격 | 포함 내용 | 타겟 등급 |
|------|------|---------|----------|

## 4. 영업 채널
| 채널 | 자동화 가능? | 법적 제한 | 우선순위 |
|------|------------|---------|---------|

## 5. 마케팅 채널
| 채널 | 컨셉/방향 | 비용 | 기대 효과 |
|------|---------|------|---------|

## 6. 첫 주 액션플랜
| Day | 할 것 | 담당 | 산출물 |
|-----|------|------|--------|

현실적으로. "이론적으로 가능"이 아니라 "내일 당장 이렇게"로."""


def run_launch_prep(context: dict, client: anthropic.Anthropic) -> str:
    """런칭 준비 파이프라인 실행."""
    print(f"\n{'='*60}")
    print("🚀 Layer 3: 런칭 준비")
    print("='*60")

    idea = context.get("clarified", context.get("idea", ""))
    strategy = context.get("minsu", "")[:500]
    market = context.get("seoyun", "")[:500]

    # 작업 전 리서치 — 경쟁사/트렌드 최신 수집
    research = research_before_task(
        role="런칭 준비",
        task=idea[:50],
        queries=[
            f"{idea[:30]} 경쟁사 가격 비교 2026",
            f"{idea[:30]} 마케팅 채널 전략 2026",
            f"{idea[:30]} 영업 자동화 방법",
        ]
    )

    user_msg = f"""프로젝트: {idea}

이사팀 전략 요약:
{strategy}

시장조사 요약:
{market}

최신 리서치:
{research[:2000]}

런칭 준비 구체화해줘."""

    full_response = ""
    with client.messages.stream(
        model=MODEL,
        max_tokens=3000,
        system=inject_context(LAUNCH_PREP_PROMPT),
        messages=[{"role": "user", "content": user_msg}],
        temperature=0.3,
    ) as stream:
        for text in stream.text_stream:
            print(text, end="", flush=True)
            full_response += text

    print()
    return full_response
