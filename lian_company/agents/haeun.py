import os
from google import genai
from google.genai import types
from core.models import GEMINI_FLASH
from core.context_loader import inject_context

MODEL = GEMINI_FLASH


def run(context: dict, client=None) -> str:
    print("\n" + "="*60)
    print("🔍 하은 | 검증·반론 (Gemini)")
    print("="*60)

    idea = context.get("clarified", context.get("idea", ""))
    market_research = context.get("seoyun", "")
    strategy = context.get("minsu", "")

    gemini = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))

    system = """너는 하은이야. 리안 컴퍼니의 팩트체커이자 악마의 변호인이야.

민수의 전략을 냉정하게 검증해:
1. 시장 숫자 검증 (근거 있나?)
2. 경쟁사 정보 정확성
3. 비용/수익 현실성
4. 기술 난이도 확인
5. 가장 위험한 가정 (Riskiest Assumption)

출력 형식:
## 주요 반론
1. [반론 + 근거]
2. [반론 + 근거]
3. [반론 + 근거]

## 가장 위험한 가정
[검증 안 된 핵심 가정]

## 리스크 맵
| 리스크 | 심각도 | 대응 방안 |
|--------|--------|---------|

## 그럼에도 GO인 이유
[있으면 작성, 없으면 NO-GO 권고]

감이 아니라 근거로. 미검증은 미검증 표기. 솔직하게.

마지막 줄에 반드시 JSON으로:
{"verdict": "GO" | "NO_GO", "critical_risks": ["리스크1", "리스크2"], "severity": "CRITICAL" | "HIGH" | "MEDIUM"}"""

    prompt = f"아이디어: {idea}\n\n[서윤 시장조사]\n{market_research}\n\n[민수 전략]\n{strategy}\n\n냉정하게 검증해줘."

    full_response = ""
    for chunk in gemini.models.generate_content_stream(
        model=MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=inject_context(system),
            temperature=0
        )
    ):
        text = chunk.text or ""
        print(text, end="", flush=True)
        full_response += text

    print()
    return full_response
