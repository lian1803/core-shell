import anthropic

MODEL = "claude-sonnet-4-6"

COMMERCIAL_KEYWORDS = ["상용화", "판매", "구독", "유료", "월정액", "수익", "고객", "사장님", "사업"]
PERSONAL_KEYWORDS = ["내가 쓸", "나만 쓸", "혼자 쓸", "개인용", "개인툴"]


def _detect_commercial(text: str) -> bool:
    """개인툴 키워드가 있으면 False, 상용화 키워드가 있으면 True, 둘 다 없으면 False."""
    for kw in PERSONAL_KEYWORDS:
        if kw in text:
            return False
    for kw in COMMERCIAL_KEYWORDS:
        if kw in text:
            return True
    return False


SYSTEM_PROMPT = """너는 시은이야. 리안 컴퍼니의 오케스트레이터이자 리안의 가장 가까운 AI 동료야.

리안은 온·오프라인 마케팅 회사를 운영하는 CEO야. 개발자는 아니야.
아이디어는 엄청 많은데 혼자서 기획·개발·마케팅을 다 할 시간이 없어.

네 역할:
1. 리안이 던진 아이디어를 받아서 명확화 질문을 해 (최대 2번)
2. 아이디어가 충분히 명확해지면 이사팀에게 넘길 준비를 해
3. 말투는 친근하게. 짧고 핵심만. 리안이 피곤하지 않게.

아이디어를 받으면 다음을 파악해야 해:
- 이게 리안 본인이 쓸 툴인가 vs 상용화 서비스인가?
- 타겟이 누구인가?
- 핵심 기능이 뭔가?

명확화가 끝나면 이렇게 마무리해:
"알겠어. 이사팀한테 넘길게. [진행해] 입력하면 시작해."
"""


def clarify(idea: str, client: anthropic.Anthropic) -> str:
    print("\n" + "="*60)
    print("🤖 시은 | 오케스트레이터")
    print("="*60)

    messages = [{"role": "user", "content": f"아이디어: {idea}"}]
    full_response = ""

    with client.messages.stream(
        model=MODEL,
        max_tokens=1000,
        system=SYSTEM_PROMPT,
        messages=messages,
    ) as stream:
        for text in stream.text_stream:
            print(text, end="", flush=True)
            full_response += text

    print()
    return full_response


def ask_clarification(idea: str, prev_answer: str, question: str, client: anthropic.Anthropic) -> str:
    print("\n" + "="*60)
    print("🤖 시은 | 오케스트레이터")
    print("="*60)

    messages = [
        {"role": "user", "content": f"아이디어: {idea}"},
        {"role": "assistant", "content": question},
        {"role": "user", "content": prev_answer},
    ]
    full_response = ""

    with client.messages.stream(
        model=MODEL,
        max_tokens=1000,
        system=SYSTEM_PROMPT,
        messages=messages,
    ) as stream:
        for text in stream.text_stream:
            print(text, end="", flush=True)
            full_response += text

    print()
    return full_response


def run(idea: str, client: anthropic.Anthropic) -> dict:
    """
    시은과 대화하며 아이디어 명확화.
    returns: {"idea": str, "clarified": str, "is_commercial": bool}
    """
    response = clarify(idea, client)

    # 진행해 포함된 경우 바로 종료
    if "[진행해]" in response or "진행해" in response.lower():
        return {"idea": idea, "clarified": idea, "is_commercial": _detect_commercial(idea)}

    # 첫 번째 명확화 질문
    print("\n리안: ", end="")
    try:
        answer1 = input().strip()
    except EOFError:
        answer1 = ""
    if not answer1:
        answer1 = "그냥 진행해줘"

    response2 = ask_clarification(idea, answer1, response, client)

    if "[진행해]" in response2 or "진행해" in response2.lower():
        clarified = f"{idea}\n추가 정보: {answer1}"
        is_commercial = _detect_commercial(clarified)
        return {"idea": idea, "clarified": clarified, "is_commercial": is_commercial}

    # 두 번째 명확화 질문
    print("\n리안: ", end="")
    try:
        answer2 = input().strip()
    except EOFError:
        answer2 = ""
    if not answer2:
        answer2 = "그냥 진행해줘"

    clarified = f"{idea}\n추가 정보: {answer1} / {answer2}"
    is_commercial = _detect_commercial(clarified)

    return {"idea": idea, "clarified": clarified, "is_commercial": is_commercial}
