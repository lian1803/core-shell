import os
import anthropic
from concurrent.futures import ThreadPoolExecutor
from dotenv import load_dotenv
from agents import sieun, seoyun, minsu, haeun, junhyeok, taeho, jihun
from core.handoff import PipelineHandoff
from core.discussion import DiscussionRoom
from core.ui import print_step, print_save_ok, print_section
from core.output import create_output_dir, save_file
from core.notifier import (
    notify_agent_complete,
    notify_discussion_round,
    notify_verdict,
    notify_execution_start,
    notify_completion,
    notify_error,
    wait_confirm,
)
from teams.education.pipeline import run as build_team

load_dotenv()


def get_client() -> anthropic.Anthropic:
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise ValueError(".env 파일에 ANTHROPIC_API_KEY가 없어. .env.example 참고해서 만들어줘.")
    return anthropic.Anthropic(api_key=api_key)


def run_pipeline(sieun_result: dict) -> None:
    client = get_client()
    context = dict(sieun_result)

    # 프로젝트명 추출 (아이디어 앞 20자)
    raw_idea = context.get("idea", "프로젝트")
    project_name = raw_idea[:20].strip()
    output_dir = create_output_dir(project_name)

    print(f"\n\n{'='*60}")
    print(f"📁 산출물 저장 경로: {output_dir}")
    print(f"{'='*60}\n")

    # ── 이사팀 ──────────────────────────────────────────────────

    # 태호 + 서윤: 병렬 실행 (둘 다 아이디어만 필요, 서로 독립)
    print(f"\n[1-2/9] 트렌드 + 시장조사 (병렬)...")

    def _run_taeho():
        try:
            return taeho.run(context, client)
        except Exception as e:
            print(f"\n⚠️  태호 에러 (건너뜀): {e}")
            return f"트렌드 스카우팅 실패: {e}"

    def _run_seoyun():
        try:
            return seoyun.run(context, client)
        except Exception as e:
            print(f"\n⚠️  서윤 에러 (건너뜀): {e}")
            return f"시장조사 실패: {e}"

    with ThreadPoolExecutor(max_workers=2) as pool:
        fut_taeho = pool.submit(_run_taeho)
        fut_seoyun = pool.submit(_run_seoyun)
        taeho_result = fut_taeho.result()
        seoyun_result = fut_seoyun.result()

    context["taeho"] = taeho_result
    save_file(output_dir, "08_트렌드_태호.md", taeho_result)
    print_save_ok("08_트렌드_태호.md")
    notify_agent_complete("태호 | 트렌드 스카우팅", 1, 9)

    context["seoyun"] = seoyun_result
    save_file(output_dir, "01_시장조사_서윤.md", seoyun_result)
    print_save_ok("01_시장조사_서윤.md")
    notify_agent_complete("서윤 | 시장조사", 2, 9)

    # 민수: 전략
    print(f"\n[3/9] 전략 수립...")
    try:
        minsu_result = minsu.run(context, client)
    except Exception as e:
        print(f"\n⚠️  민수 에러 (건너뜀): {e}")
        minsu_result = f"전략 수립 실패: {e}"
    context["minsu"] = minsu_result
    save_file(output_dir, "02_전략_민수.md", minsu_result)
    print_save_ok("02_전략_민수.md")
    notify_agent_complete("민수 | 전략 수립", 3, 9)

    # 하은: 검증
    print(f"\n[4/9] 검증/반론...")
    try:
        haeun_result = haeun.run(context, client)
    except Exception as e:
        print(f"\n⚠️  하은 에러 (건너뜀): {e}")
        haeun_result = f"검증 실패: {e}"
    context["haeun"] = haeun_result
    save_file(output_dir, "03_검증_하은.md", haeun_result)
    print_save_ok("03_검증_하은.md")
    notify_agent_complete("하은 | 검증/반론", 4, 9)

    # 토론 루프: 민수↔하은 (최대 2라운드)
    print(f"\n[4.5/9] 토론 루프...")
    try:
        discussion = DiscussionRoom()
        context = discussion.run(context, client)
    except Exception as e:
        print(f"\n⚠️  토론 루프 에러 (건너뜀): {e}")
        context["discussion_transcript"] = []
    save_file(output_dir, "03b_토론_결과.md", "\n\n".join([
        f"## 라운드 {t['round']}\n{t['analysis']}\n\n[민수 수정]\n{t['minsu_revised']}\n\n[하은 최종]\n{t['haeun_final']}"
        for t in context.get("discussion_transcript", [])
    ]) or "토론 없음")
    print_save_ok("03b_토론_결과.md")

    # 준혁: 최종 판단
    print(f"\n[5/9] 최종 판단...")
    try:
        junhyeok_result = junhyeok.run(context, client)
    except Exception as e:
        print(f"\n⚠️  준혁 에러: {e}")
        junhyeok_result = {"text": f"판단 실패: {e}", "verdict": "CONDITIONAL_GO", "score": 50}
    context["junhyeok_text"] = junhyeok_result["text"]
    context["verdict"] = junhyeok_result["verdict"]
    context["score"] = junhyeok_result["score"]

    import json
    save_file(output_dir, "04_최종판단_준혁.json", json.dumps({
        "verdict": junhyeok_result["verdict"],
        "score": junhyeok_result["score"],
        "text": junhyeok_result["text"]
    }, ensure_ascii=False, indent=2))
    print_save_ok("04_최종판단_준혁.json")
    notify_agent_complete("준혁 | 최종 판단", 5, 9)
    notify_verdict(junhyeok_result["verdict"], junhyeok_result["score"])

    # GO 판단이 아니면 종료 (FORCE_GO 환경변수로 강제 통과 가능)
    if junhyeok_result["verdict"] == "NO_GO" and not os.getenv("FORCE_GO"):
        print(f"\n\n❌ 준혁 판단: NO-GO (점수: {junhyeok_result['score']})")
        print("실행팀 진행 안 함. 아이디어를 수정하거나 다른 방향을 시도해봐.")
        print(f"\n📁 결과 저장: {output_dir}")
        return

    # ── 리안 컨펌 ───────────────────────────────────────────────

    verdict_label = {
        "GO": f"GO ({junhyeok_result['score']}점)",
        "CONDITIONAL_GO": f"조건부 GO ({junhyeok_result['score']}점) — 조건 확인 필요",
    }.get(junhyeok_result["verdict"], "GO")

    print(f"\n\n{'='*60}")
    print(f"  이사팀 완료. 준혁 판단: {verdict_label}")
    print(f"  결과 확인: {output_dir}")
    print(f"{'='*60}")

    # CONDITIONAL_GO면 리안 컨펌 필요, GO면 자동 진행
    if junhyeok_result["verdict"] == "CONDITIONAL_GO":
        should_proceed = wait_confirm("조건부 GO — 실행팀 진행할까? [y/n]")
        if not should_proceed:
            print("\n알겠어. 결과는 저장돼 있어.")
            print(f"📁 {output_dir}")
            return
        print("\n실행팀 진행 승인됨.")
    else:
        print(f"\n실행팀 자동 진행 (GO 판정)")

    notify_execution_start()

    # ── 지훈: PRD 작성 ────────────────────────────────────────────

    print(f"\n[6/9] PRD 작성 (지훈)...")
    try:
        prd_result = jihun.run(context, client)
        context["prd"] = prd_result
    except Exception as e:
        print(f"\n⚠️  지훈 에러: {e}")
        prd_result = f"PRD 작성 실패: {e}"
        context["prd"] = prd_result
    save_file(output_dir, "05_PRD_지훈.md", prd_result)
    print_save_ok("05_PRD_지훈.md")
    notify_agent_complete("지훈 | PRD 작성", 6, 9)

    # ── PipelineHandoff: 소프트웨어 프로젝트면 브리핑 문서 생성 ──────

    is_software = context.get("is_software", False)
    handoff_path = None
    if is_software:
        print(f"\n[6.5/9] UltraProduct 브리핑 문서 생성...")
        try:
            handoff = PipelineHandoff(context, output_dir)
            handoff_path = handoff.generate()
            print(f"✅ 브리핑 문서 생성: {handoff_path}")
            print(f"\n{'='*60}")
            print(f"  🚀 소프트웨어 프로젝트 — UltraProduct 준비 완료!")
            print(f"{'='*60}")
            print(f"  다음 단계:")
            print(f"  1. 아래 폴더로 이동:")
            print(f"     cd \"{handoff_path}\"")
            print(f"  2. Claude Code 실행:")
            print(f"     claude")
            print(f"  3. /work 입력 → Wave 3부터 자동 실행")
            print(f"{'='*60}\n")
        except Exception as e:
            print(f"\n⚠️  핸드오프 에러: {e}")

    # ── 리안 인터뷰 + 팀 설계 + 교육팀 ────────────────────────────

    print(f"\n\n{'='*60}")
    print(f"  팀 설계 시작")
    print(f"{'='*60}")

    # 시은: 리안 워크플로우 인터뷰
    print(f"\n[6/8] 리안 인터뷰 (실제 워크플로우 파악)...")
    try:
        interview = sieun.interview_for_team(context, client)
        context["interview"] = interview
    except Exception as e:
        print(f"\n⚠️  인터뷰 에러: {e}")
        context["interview"] = ""
    save_file(output_dir, "05_리안인터뷰_시은.md", context.get("interview", ""))
    print_save_ok("05_리안인터뷰_시은.md")

    # 시은: 팀 구성 설계
    print(f"\n[7/8] 팀 구성 설계...")
    try:
        team_name, team_purpose = sieun.design_team(context, client)
    except Exception as e:
        print(f"\n⚠️  시은 팀 설계 에러: {e}")
        team_name = project_name + "_팀"
        team_purpose = context.get("clarified", "")
    save_file(output_dir, "06_팀설계_시은.md", f"# 팀 설계\n\n팀 이름: {team_name}\n\n팀 업무:\n{team_purpose}")
    print_save_ok("06_팀설계_시은.md")
    notify_agent_complete("시은 | 팀 구성 설계", 7, 8)

    # 리안 확인 + 수정
    print(f"\n\n{'='*60}")
    print(f"  📋 시은이 설계한 팀:")
    print(f"  팀 이름: {team_name}")
    print(f"  팀 업무:")
    for line in team_purpose.split("\n")[:8]:
        if line.strip():
            print(f"    {line.strip()}")
    print(f"{'='*60}")
    print(f"\n리안, 이대로 갈까? (수정할 거 있으면 말해, 없으면 엔터)")
    print("리안: ", end="")
    try:
        team_feedback = input().strip()
    except EOFError:
        team_feedback = ""

    if team_feedback and team_feedback.lower() not in ("", "ㅇ", "ㅇㅇ", "ok", "맞아", "그래", "진행"):
        # 시은이 피드백 반영해서 재설계
        print(f"\n시은: 알겠어, 수정할게...")
        try:
            team_name, team_purpose = sieun.design_team(
                {**context, "team_feedback": team_feedback}, client
            )
        except Exception as e:
            print(f"⚠️  재설계 에러: {e}")
        save_file(output_dir, "06_팀설계_시은_수정.md", f"# 팀 설계 (수정)\n\n팀 이름: {team_name}\n\n팀 업무:\n{team_purpose}")

    # 이사팀 분석 결과를 팀 업무에 포함
    board_summary = f"""{team_purpose}

=== 이사팀 분석 결과 (팀 교육 시 참고) ===
트렌드: {context.get('taeho', '')[:300]}
시장조사: {context.get('seoyun', '')[:500]}
전략: {context.get('minsu', '')[:500]}
검증: {context.get('haeun', '')[:300]}
Go/No-Go: {context.get('verdict', '')} ({context.get('score', '')}점)"""

    # 교육팀: 자동으로 팀 생성
    print(f"\n[7/7] 교육팀 → 팀 생성 + 교육...")
    try:
        team_dir = build_team(team_name, board_summary)
        print(f"\n✅ {team_name} 생성 완료: {team_dir}")
        notify_agent_complete(f"교육팀 | {team_name} 생성", 7, 7)
    except Exception as e:
        print(f"\n⚠️  교육팀 에러: {e}")
        team_dir = None

    # 이사팀 결과 저장
    save_file(output_dir, "06_이사팀_컨텍스트.md", board_summary)
    print_save_ok("06_이사팀_컨텍스트.md")

    # ── 완료 ──────────────────────────────────────────────────

    print(f"\n\n{'='*60}")
    print(f"  리안 컴퍼니 완료!")
    print(f"{'='*60}")
    print(f"\n  산출물: {output_dir}")
    if team_dir:
        print(f"  생성된 팀: {team_dir}")

    # 디스코드 완료 알림
    notify_completion(output_dir, project_name)
