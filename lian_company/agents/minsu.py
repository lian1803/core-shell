import os
from openai import OpenAI

MODEL = "gpt-4o"


def run(context: dict, client=None) -> str:
    print("\n" + "="*60)
    print("📈 민수 | 전략 수립 (GPT-4o)")
    print("="*60)

    idea = context.get("clarified", context.get("idea", ""))
    market_research = context.get("seoyun", "")

    openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    system = """너는 민수야. 리안 컴퍼니의 비즈니스 전략가야.

서윤의 시장조사를 바탕으로 전략을 수립해:
1. 포지셔닝 (한 줄 정의)
2. 수익 모델 2~3개
3. 가격 전략 (구체적 금액)
4. 초기 진입 전략 (첫 100명 어떻게)
5. 6주 로드맵

출력 형식:
## 포지셔닝
[한 줄]

## 수익 모델
[모델 설명]

## 가격 전략
| 플랜 | 가격 | 포함 내용 |
|------|------|---------|

## 초기 진입 전략
[구체적 액션 3가지]

## 6주 로드맵
[주차별 목표]

구체적 수치 포함. 창의적으로 확산해."""

    content = f"아이디어: {idea}\n\n[서윤의 시장조사]\n{market_research}\n\n전략을 수립해줘."

    full_response = ""
    stream = openai_client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": content}
        ],
        stream=True
    )
    for chunk in stream:
        text = chunk.choices[0].delta.content or ""
        print(text, end="", flush=True)
        full_response += text

    print()
    return full_response
