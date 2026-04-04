import os
import sys
import anthropic
from dotenv import load_dotenv
from teams.온라인마케팅팀 import 서진혁
from teams.온라인마케팅팀 import 한소율
from teams.온라인마케팅팀 import 윤채원
from teams.온라인마케팅팀 import 박시우
from teams.온라인마케팅팀 import 이도현
from teams.온라인마케팅팀 import 강하린

load_dotenv()

OUTPUT_BASE = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), "team")


def get_client() -> anthropic.Anthropic:
    return anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))


def save(output_dir: str, filename: str, content: str):
    os.makedirs(output_dir, exist_ok=True)
    path = os.path.join(output_dir, filename)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"\n💾 저장: {path}")


def team_interview(task: str, client: anthropic.Anthropic) -> str:
    """팀 시작 전 리안한테 디테일 인터뷰. 자동화 모드에서는 스킵."""
    # 자동화 모드 감지: sys.argv에 인자 있고 stdin이 tty가 아니면 스킵
    is_interactive = sys.stdin.isatty() if hasattr(sys.stdin, 'isatty') else True

    if not is_interactive:
        # subprocess/autopilot에서 호출 → 인터뷰 스킵, 기본값 반환
        return f"리안 답변:\n(자동화 모드 - 인터뷰 스킵)"

    print("\n" + "="*60)
    print("🎤 팀 인터뷰 | 리안한테 디테일 파악")
    print("="*60)

    interview_prompt = "너는 온라인마케팅팀의 팀 리더야. 리안(CEO, 비개발자)한테 실제 업무를 파악해야 해. 구체적이고 실용적인 질문 3~5개를 한번에 물어봐. 짧고 친근하게."

    resp = ""
    with client.messages.stream(
        model="claude-sonnet-4-5",
        max_tokens=400,
        system=interview_prompt,
        messages=[{"role": "user", "content": f"업무: {task}"}],
    ) as stream:
        for text in stream.text_stream:
            print(text, end="", flush=True)
            resp += text

    print("\n\n리안: ", end="")
    try:
        answer = input().strip()
    except EOFError:
        answer = ""

    return f"리안 답변:\n{answer}"


def run(task: str = ""):
    client = get_client()
    context = {"task": task}

    print(f"\n{'='*60}")
    print(f"🏢 온라인마케팅팀 가동")
    print(f"업무: {task}")
    print(f"{'='*60}")

    output_dir = os.path.join(OUTPUT_BASE, "온라인마케팅팀")

    # 팀 인터뷰 (리안한테 디테일 파악)
    interview = team_interview(task, client)
    context["interview"] = interview
    save(output_dir, "00_팀인터뷰.md", interview)

    print("\n[1/6] 서진혁...")
    result_서진혁 = 서진혁.run(context, client)
    context["서진혁"] = result_서진혁
    save(output_dir, "서진혁_결과.md", result_서진혁)

    print("\n[2/6] 한소율...")
    result_한소율 = 한소율.run(context, client)
    context["한소율"] = result_한소율
    save(output_dir, "한소율_결과.md", result_한소율)

    print("\n[3/6] 윤채원...")
    result_윤채원 = 윤채원.run(context, client)
    context["윤채원"] = result_윤채원
    save(output_dir, "윤채원_결과.md", result_윤채원)

    print("\n[4/6] 박시우...")
    result_박시우 = 박시우.run(context, client)
    context["박시우"] = result_박시우
    save(output_dir, "박시우_결과.md", result_박시우)

    print("\n[5/6] 이도현...")
    result_이도현 = 이도현.run(context, client)
    context["이도현"] = result_이도현
    save(output_dir, "이도현_결과.md", result_이도현)

    print("\n[6/6] 강하린...")
    result_강하린 = 강하린.run(context, client)
    context["강하린"] = result_강하린
    save(output_dir, "강하린_결과.md", result_강하린)


    # 결과물을 지식으로 저장 + 리안 피드백 수집
    try:
        import sys
        sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
        from knowledge.manager import save_team_result, collect_feedback
        for key, val in context.items():
            if key not in ("task", "interview") and isinstance(val, str) and len(val) > 100:
                save_team_result("온라인마케팅팀", f"{key}.md", val)
        collect_feedback("온라인마케팅팀")
    except Exception as e:
        print(f"\n⚠️ 지식 저장/피드백 수집 실패: {e}")

    print(f"\n{'='*60}")
    print("✅ 완료")
    print(f"저장 위치: {output_dir}")
    print(f"{'='*60}")
    return context
