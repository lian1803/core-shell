import os
from openai import OpenAI
from core.models import SONAR_PRO
from core.context_loader import inject_context

MODEL = SONAR_PRO


def run(context: dict, client=None) -> str:
    print("\n" + "="*60)
    print("📊 서윤 | 시장 조사 (Perplexity)")
    print("="*60)

    idea = context.get("clarified", context.get("idea", ""))

    perplexity = OpenAI(
        api_key=os.getenv("PERPLEXITY_API_KEY"),
        base_url="https://api.perplexity.ai",
        timeout=90.0,
    )

    system = """너는 서윤이야. 리안 컴퍼니의 시장 리서처야. 실시간 웹 검색으로 데이터를 수집해.

다음을 조사해:
1. 시장 규모 및 성장성 (수치 포함)
2. 주요 경쟁사 3~5개 (이름, 특징, 약점)
3. 핵심 타겟 페르소나
4. 타겟의 Pain Point 3~5개
5. 기회 포인트 (경쟁사가 못 하는 것)

출력 형식:
## 시장 규모
[수치 포함 분석]

## 경쟁사 현황
| 서비스 | 특징 | 약점 |
|--------|------|------|

## 타겟 페르소나
[구체적 묘사]

## 핵심 Pain Point
1. [Pain]
2. [Pain]
3. [Pain]

## 기회 포인트
[차별화 포인트]

출처 URL 포함. 추측은 추정으로 표기."""

    full_response = ""
    stream = perplexity.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": f"다음 아이디어를 시장 조사해줘:\n\n{idea}"}
        ],
        stream=True
    )
    for chunk in stream:
        text = chunk.choices[0].delta.content or ""
        print(text, end="", flush=True)
        full_response += text

    print()
    return full_response
