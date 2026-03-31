import os
import re
import openai

from core.models import MINIMAX as MINIMAX_MODEL, CLAUDE_HAIKU

SYSTEM_PROMPT = """너는 태호야. 리안 컴퍼니의 트렌드 스카우터야.

아이디어 분야와 관련된 최신 트렌드, 기술, 시장 변화를 분석해.
GitHub Trending, HN, ProductHunt, Reddit 등에서 나올 법한 인사이트를 제공해.

출력 형식:
## 관련 트렌드
1. [트렌드 1] ⭐ (리안과 직결되면 별표)
2. [트렌드 2]
3. [트렌드 3]

## 리안에게 의미 있는 것
[왜 이게 지금 중요한지 1~2줄]

## 활용 제안
[이 트렌드를 어떻게 써먹을 수 있는지]

짧고 핵심만. 3분 안에 읽을 수 있게.

⚠️ 절대 금지: 중국어/일본어 한자 사용. 반드시 한글로만 출력."""


def _run_minimax(idea: str) -> str:
    minimax = openai.OpenAI(
        api_key=os.getenv("MINIMAX_API_KEY"),
        base_url="https://api.minimax.io/v1",
        timeout=60.0,
    )
    stream = minimax.chat.completions.create(
        model=MINIMAX_MODEL,
        max_tokens=1000,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"이 아이디어 관련 트렌드 분석해줘: {idea}"}
        ],
        stream=True
    )
    full_response = ""
    for chunk in stream:
        if chunk.choices[0].delta.content:
            text = chunk.choices[0].delta.content
            print(text, end="", flush=True)
            full_response += text
    return re.sub(r'<think>.*?</think>', '', full_response, flags=re.DOTALL).strip()


def _run_claude_haiku(idea: str, client) -> str:
    print("  (Claude Haiku로 폴백)")
    full_response = ""
    with client.messages.stream(
        model=CLAUDE_HAIKU,
        max_tokens=1000,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": f"이 아이디어 관련 트렌드 분석해줘: {idea}"}],
        temperature=0.5,
    ) as stream:
        for text in stream.text_stream:
            print(text, end="", flush=True)
            full_response += text
    return full_response


def run(context: dict, client=None) -> str:
    print("\n" + "="*60)
    print("🔭 태호 | 트렌드 스카우팅")
    print("="*60)

    idea = context.get("clarified", context.get("idea", ""))

    minimax_key = os.getenv("MINIMAX_API_KEY")
    if minimax_key:
        try:
            result = _run_minimax(idea)
            print()
            return result
        except Exception as e:
            print(f"\n⚠️  MiniMax 에러, Claude Haiku로 폴백: {e}")

    result = _run_claude_haiku(idea, client)
    print()
    return result
