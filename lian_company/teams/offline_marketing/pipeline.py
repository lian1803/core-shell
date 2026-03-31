import os
import anthropic
from dotenv import load_dotenv
from teams.offline_marketing import researcher, strategist, copywriter

load_dotenv()

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), "team", "[진행중] 오프라인 마케팅", "소상공인_영업툴")
os.makedirs(OUTPUT_DIR, exist_ok=True)


def get_client() -> anthropic.Anthropic:
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise ValueError(".env에 ANTHROPIC_API_KEY 없음")
    return anthropic.Anthropic(api_key=api_key)


def save(filename: str, content: str):
    path = os.path.join(OUTPUT_DIR, filename)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"\n💾 저장: {path}")


def run(industry: str = "소상공인 네이버 플레이스 마케팅 대행"):
    client = get_client()
    context = {"industry": industry}

    print(f"\n{'='*60}")
    print(f"🏢 오프라인 마케팅 팀 가동")
    print(f"대상: {industry}")
    print(f"{'='*60}")

    # 현재 영업 자료 로드 (개선 참고용)
    try:
        with open(os.path.join(OUTPUT_DIR, "영업_스크립트.md"), encoding="utf-8") as f:
            context["current_materials"] = f.read()
    except Exception:
        context["current_materials"] = ""

    # Step 1: 리서처 — 영업 전문가 자료 방대 수집
    print("\n[1/3] 영업 전문가 자료 수집...")
    research = researcher.run(context)
    context["research"] = research
    save("_research_영업전문가자료.md", research)

    # Step 2: 전략가 — 영업 전략 재설계
    print("\n[2/3] 영업 전략 재설계...")
    strategy = strategist.run(context, client)
    context["strategy"] = strategy
    save("영업_전략_재설계.md", strategy)

    # Step 3: 카피라이터 — 스크립트 + PPT 생성
    print("\n[3/3] 스크립트 + PPT 카피 생성...")
    copy = copywriter.run(context, client)
    context["copy"] = copy
    save("영업_스크립트_v2.md", copy)

    # 보고사항들.md 업데이트
    try:
        import sys
        sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
        from knowledge.manager import write_report, save_team_result, collect_feedback

        # 결과물 지식으로 저장
        save_team_result("offline_marketing", "_research_영업전문가자료.md", research,
                         tags=["영업", "SPIN", "Challenger", "클로징", "소상공인"])
        save_team_result("offline_marketing", "영업_전략_재설계.md", strategy,
                         tags=["영업", "전략", "퍼널", "소상공인"])
        save_team_result("offline_marketing", "영업_스크립트_v2.md", copy,
                         tags=["영업", "DM", "스크립트", "카피"])

        # 보고
        report_content = (
            f"**{industry}** 영업 자료 완성.\n\n"
            f"- 재원: 영업 전문가 자료 수집 완료 (SPIN/Challenger 기반)\n"
            f"- 승현: 영업 전략 재설계 완료\n"
            f"- 예진: DM 스크립트 + PPT 카피 완성\n\n"
            f"저장 위치: `{OUTPUT_DIR}`\n\n"
            f"리안, 스크립트 확인하고 실제 발송 전에 한 번 봐줘. "
            f"특히 업종별 변형 멘트 맞는지 체크 부탁해."
        )
        write_report("재원/승현/예진", "오프라인 마케팅팀", report_content)

        # 피드백 수집
        collect_feedback("offline_marketing")
    except Exception as e:
        print(f"\n보고/저장 실패: {e}")

    print(f"\n{'='*60}")
    print("✅ 오프라인 마케팅 팀 완료")
    print(f"저장 위치: {OUTPUT_DIR}")
    print(f"{'='*60}")

    return context
