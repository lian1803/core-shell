import anthropic

MODEL = "claude-haiku-4-5-20251001"

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

짧고 핵심만. 3분 안에 읽을 수 있게."""


def run(context: dict, client: anthropic.Anthropic) -> str:
    print("\n" + "="*60)
    print("🔭 태호 | 트렌드 스카우팅")
    print("="*60)

    idea = context.get("clarified", context.get("idea", ""))
    full_response = ""

    with client.messages.stream(
        model=MODEL,
        max_tokens=1000,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": f"이 아이디어 관련 트렌드 분석해줘: {idea}"}],
    ) as stream:
        for text in stream.text_stream:
            print(text, end="", flush=True)
            full_response += text

    print()
    return full_response
