import os
import sys
import anthropic
from dotenv import load_dotenv
from teams.온라인납품팀 import 서진호
from teams.온라인납품팀 import 한서연
from teams.온라인납품팀 import 박지우
from teams.온라인납품팀 import 최도현
from teams.온라인납품팀 import 윤하은
from teams.온라인납품팀 import 정민재
from teams.온라인납품팀 import 김태리

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

    interview_prompt = "너는 온라인납품팀의 팀 리더야. 리안(CEO, 비개발자)한테 실제 업무를 파악해야 해. 구체적이고 실용적인 질문 3~5개를 한번에 물어봐. 짧고 친근하게."

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
    print(f"🏢 온라인납품팀 가동")
    print(f"업무: {task}")
    print(f"{'='*60}")

    output_dir = os.path.join(OUTPUT_BASE, "온라인납품팀")

    # 미션 + 학습 자동 로드 (에이전트한테 자동 전달)
    enrich_context = None
    self_critique_all = None
    try:
        sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
        from core.pipeline_utils import enrich_context, self_critique_all
        context = enrich_context(context, team_slug="온라인납품팀")
    except Exception as e:
        print(f"⚠️ 미션/학습 로드 실패: {e}")

    # 팀 인터뷰 (리안한테 디테일 파악)
    interview = team_interview(task, client)
    context["interview"] = interview
    save(output_dir, "00_팀인터뷰.md", interview)

    print("\n[1/7] 서진호...")
    result_서진호 = 서진호.run(context, client)
    context["서진호"] = result_서진호
    save(output_dir, "서진호_결과.md", result_서진호)

    print("\n[2/7] 한서연...")
    result_한서연 = 한서연.run(context, client)
    context["한서연"] = result_한서연
    save(output_dir, "한서연_결과.md", result_한서연)

    print("\n[3/7] 박지우...")
    result_박지우 = 박지우.run(context, client)
    context["박지우"] = result_박지우
    save(output_dir, "박지우_결과.md", result_박지우)

    print("\n[4/7] 최도현...")
    result_최도현 = 최도현.run(context, client)
    context["최도현"] = result_최도현
    save(output_dir, "최도현_결과.md", result_최도현)

    print("\n[5/7] 윤하은...")
    result_윤하은 = 윤하은.run(context, client)
    context["윤하은"] = result_윤하은
    save(output_dir, "윤하은_결과.md", result_윤하은)

    print("\n[6/7] 정민재...")
    result_정민재 = 정민재.run(context, client)
    context["정민재"] = result_정민재
    save(output_dir, "정민재_결과.md", result_정민재)

    print("\n[7/7] 김태리...")
    result_김태리 = 김태리.run(context, client)
    context["김태리"] = result_김태리
    save(output_dir, "김태리_결과.md", result_김태리)


    # 자가점검
    try:
        if self_critique_all is None:
            raise Exception("self_critique_all 미로드")
        critique = self_critique_all(context, client, team_name="온라인납품팀")
        context["critique"] = critique
        save(output_dir, "_자가점검_결과.md", critique.get("full_critique", ""))
    except Exception as e:
        print(f"\n⚠️ 자가점검 실패: {e}")

    # 결과물을 지식으로 저장 + 리안 피드백 수집
    try:
        sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
        from knowledge.manager import save_team_result, collect_feedback
        for key, val in context.items():
            if key not in ("task", "interview") and isinstance(val, str) and len(val) > 100:
                save_team_result("온라인납품팀", f"{key}.md", val)
        collect_feedback("온라인납품팀")
    except Exception as e:
        print(f"\n⚠️ 지식 저장/피드백 수집 실패: {e}")

    print(f"\n{'='*60}")
    print("✅ 완료")
    print(f"저장 위치: {output_dir}")
    print(f"{'='*60}")
    return context
