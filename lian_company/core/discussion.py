"""
DiscussionRoom — 민수(전략)와 하은(검증)의 토론 루프
최대 1라운드. 시은이 라운드 분석.
"""
import anthropic
import os
from google import genai
from google.genai import types
from core.context_loader import inject_context


def analyze_round(round_num: int, minsu_text: str, haeun_text: str, client: anthropic.Anthropic) -> str:
    """시은이 토론 라운드를 분석하고 핵심 쟁점 정리."""
    print(f"\n  [시은 라운드 {round_num} 분석 중...]")
    system = """너는 시은이야. 민수(전략)와 하은(검증) 사이의 핵심 쟁점을 정리해.

출력:
## 라운드 분석
- 민수 핵심 주장: [1줄]
- 하은 핵심 반론: [1줄]
- 미해결 쟁점: [구체적으로]
- 민수에게 요청: [수정해야 할 부분]"""

    content = f"[민수 전략]\n{minsu_text}\n\n[하은 반론]\n{haeun_text}\n\n핵심 쟁점 정리해줘."

    full_response = ""
    with client.messages.stream(
        model="claude-sonnet-4-6",
        max_tokens=500,
        system=system,
        messages=[{"role": "user", "content": content}],
        temperature=0.3,
    ) as stream:
        for text in stream.text_stream:
            print(text, end="", flush=True)
            full_response += text
    print()
    return full_response


def minsu_revise(original_strategy: str, haeun_objections: str, round_analysis: str, idea: str) -> str:
    """민수가 하은 반론을 반영해 전략 수정."""
    import os
    from openai import OpenAI

    print(f"\n  [민수 전략 수정 중...]")
    openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"), timeout=90.0)

    system = """너는 민수야. 하은의 반론을 반영해서 전략을 수정해.
반론 중 타당한 것은 수정하고, 타당하지 않은 것은 근거를 들어 반박해.
형식은 원래 전략과 동일하게 유지. 수정/반박한 부분은 [수정] 또는 [반박] 태그 붙여."""

    content = f"""아이디어: {idea}

[원래 전략]
{original_strategy}

[하은 반론]
{haeun_objections}

[시은 쟁점 분석]
{round_analysis}

반론 반영해서 전략 수정해줘."""

    full_response = ""
    stream = openai_client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": content}
        ],
        stream=True,
        temperature=0.7
    )
    for chunk in stream:
        text = chunk.choices[0].delta.content or ""
        print(text, end="", flush=True)
        full_response += text
    print()
    return full_response


def haeun_final_check(revised_strategy: str, original_objections: str, idea: str) -> str:
    """하은이 수정된 전략 최종 검증."""
    print(f"\n  [하은 최종 검증 중...]")
    gemini = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))

    system = """너는 하은이야. 민수가 반론을 반영해서 전략을 수정했어. 최종 검증해.
원래 반론이 제대로 반영됐는지, 새로운 리스크는 없는지 확인.
형식은 원래 검증 결과와 동일. 마지막에 JSON:
{"verdict": "GO" | "NO_GO", "critical_risks": [], "severity": "CRITICAL" | "HIGH" | "MEDIUM", "resolved": true | false}"""

    prompt = f"아이디어: {idea}\n\n[수정된 전략]\n{revised_strategy}\n\n[원래 반론]\n{original_objections}\n\n최종 검증해."

    full_response = ""
    for chunk in gemini.models.generate_content_stream(
        model="gemini-2.5-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=system,
            temperature=0
        )
    ):
        text = chunk.text or ""
        print(text, end="", flush=True)
        full_response += text
    print()
    return full_response


class DiscussionRoom:
    """민수↔하은 토론 루프 관리. 최대 2라운드."""

    MAX_ROUNDS = 1

    def run(self, context: dict, client: anthropic.Anthropic) -> dict:
        """
        토론 루프 실행.
        returns: 업데이트된 context (minsu, haeun, discussion_transcript 포함)
        """
        idea = context.get("clarified", context.get("idea", ""))
        transcript = []

        minsu_text = context.get("minsu", "")
        haeun_text = context.get("haeun", "")

        print(f"\n{'='*60}")
        print(f"  토론 루프 시작 (최대 {self.MAX_ROUNDS}라운드)")
        print(f"{'='*60}")

        for round_num in range(1, self.MAX_ROUNDS + 1):
            print(f"\n  --- 라운드 {round_num} ---")

            # 시은 라운드 분석
            round_analysis = analyze_round(round_num, minsu_text, haeun_text, client)

            # 미해결 쟁점 없으면 조기 종료
            if "미해결 쟁점" not in round_analysis or "없음" in round_analysis:
                print(f"\n  라운드 {round_num}: 쟁점 해결됨. 토론 종료.")
                break

            # 민수 전략 수정
            revised_minsu = minsu_revise(minsu_text, haeun_text, round_analysis, idea)

            # 하은 최종 검증
            final_haeun = haeun_final_check(revised_minsu, haeun_text, idea)

            transcript.append({
                "round": round_num,
                "analysis": round_analysis,
                "minsu_revised": revised_minsu,
                "haeun_final": final_haeun
            })

            # 다음 라운드용 업데이트
            minsu_text = revised_minsu
            haeun_text = final_haeun

            # resolved면 종료
            import json, re
            json_match = re.search(r'\{[^{}]*"resolved"[^{}]*\}', final_haeun, re.DOTALL)
            if json_match:
                try:
                    data = json.loads(json_match.group())
                    if data.get("resolved", False):
                        print(f"\n  라운드 {round_num}: 하은이 수정 확인. 토론 종료.")
                        break
                except (json.JSONDecodeError, ValueError):
                    pass

        context["minsu"] = minsu_text
        context["haeun"] = haeun_text
        context["discussion_transcript"] = transcript

        print(f"\n{'='*60}")
        print(f"  토론 완료. {len(transcript)}라운드 진행됨.")
        print(f"{'='*60}")

        return context
