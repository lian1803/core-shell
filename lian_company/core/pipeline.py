import os
import anthropic
from dotenv import load_dotenv
from agents import seoyun, minsu, haeun, junhyeok, jihun, jongbum, sua, taeho
from core.ui import print_step, print_save_ok, print_section
from core.output import create_output_dir, save_file

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

    # 태호: 트렌드 먼저 (선택적, 빠르게)
    print(f"\n[1/9] 트렌드 스카우팅...")
    taeho_result = taeho.run(context, client)
    context["taeho"] = taeho_result
    save_file(output_dir, "08_트렌드_태호.md", taeho_result)
    print_save_ok("08_트렌드_태호.md")

    # 서윤: 시장조사
    print(f"\n[2/9] 시장조사...")
    seoyun_result = seoyun.run(context, client)
    context["seoyun"] = seoyun_result
    save_file(output_dir, "01_시장조사_서윤.md", seoyun_result)
    print_save_ok("01_시장조사_서윤.md")

    # 민수: 전략
    print(f"\n[3/9] 전략 수립...")
    minsu_result = minsu.run(context, client)
    context["minsu"] = minsu_result
    save_file(output_dir, "02_전략_민수.md", minsu_result)
    print_save_ok("02_전략_민수.md")

    # 하은: 검증
    print(f"\n[4/9] 검증/반론...")
    haeun_result = haeun.run(context, client)
    context["haeun"] = haeun_result
    save_file(output_dir, "03_검증_하은.md", haeun_result)
    print_save_ok("03_검증_하은.md")

    # 준혁: 최종 판단
    print(f"\n[5/9] 최종 판단...")
    junhyeok_result = junhyeok.run(context, client)
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
    print(f"\n실행팀 진행할까? 기획서 만들고 /work 준비해줄게. [ㅇㅇ/ㄴㄴ]")
    print("리안: ", end="")
    confirm = input().strip().lower()

    if confirm in ("ㄴㄴ", "ㄴ", "no", "n", "취소"):
        print("\n알겠어. 결과는 저장돼 있어.")
        print(f"📁 {output_dir}")
        return

    # ── 실행팀 ──────────────────────────────────────────────────

    print(f"\n\n{'='*60}")
    print(f"  실행팀 시작.")
    print(f"{'='*60}")

    # 지훈: PRD
    print(f"\n[6/9] PRD 작성...")
    jihun_result = jihun.run(context, client)
    context["jihun"] = jihun_result
    save_file(output_dir, "05_PRD_지훈.md", jihun_result)
    print_save_ok("05_PRD_지훈.md")

    # ── 리안 PRD 토론 ────────────────────────────────────────────
    prd_version = 1
    while True:
        print(f"\n{'='*60}")
        print(f"  PRD v{prd_version} 완료.")
        print(f"  수정할 거 있으면 말해줘. 없으면 'ok' 입력.")
        print(f"{'='*60}")
        print("리안: ", end="")
        feedback = input().strip()

        if feedback.lower() in ("ok", "ㅇㅇ", "진행해", "좋아", "괜찮아", "없어", ""):
            break

        prd_version += 1
        context["lian_feedback"] = feedback
        context["previous_prd"] = context["jihun"]
        print(f"\n[PRD v{prd_version}] 피드백 반영해서 다시 작성할게...")
        jihun_result = jihun.run(context, client)
        context["jihun"] = jihun_result
        save_file(output_dir, f"05_PRD_지훈_v{prd_version}.md", jihun_result)
        print_save_ok(f"05_PRD_지훈_v{prd_version}.md")

    # 피드백 컨텍스트 정리 (종범에게 넘기기 전)
    context.pop("lian_feedback", None)
    context.pop("previous_prd", None)

    # 종범: 구현 지시서
    print(f"\n[7/9] 구현 지시서...")
    jongbum_result = jongbum.run(context, client)
    context["jongbum"] = jongbum_result
    save_file(output_dir, "06_구현지시서_종범.md", jongbum_result)
    print_save_ok("06_구현지시서_종범.md")

    # projects/{프로젝트명}/CLAUDE.md 에 저장 → /work 바로 사용 가능
    safe_project = project_name.replace(" ", "_")
    project_dir = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
        "projects", safe_project
    )
    os.makedirs(project_dir, exist_ok=True)

    # CLAUDE.md에 LAINCP 컨텍스트 헤더 추가
    from datetime import date
    project_type = "상용화 서비스" if context.get("is_commercial", False) else "개인 툴"
    claude_md_header = f"""> **LAINCP 자동 생성 프로젝트**
> 리안 컴퍼니 파이프라인이 생성한 구현 지시서야.
> 이 폴더에서 Claude Code 열고 `/work` 입력하면 Wave 1~6 자동 실행돼.
>
> - **프로젝트 유형**: {project_type}
> - **아이디어**: {raw_idea}
> - **생성일**: {date.today()}

---

"""
    save_file(project_dir, "CLAUDE.md", claude_md_header + jongbum_result)
    print(f"  /work 준비 완료: projects/{safe_project}/CLAUDE.md")

    # 수아: 마케팅 (상용화만)
    print(f"\n[9/9] 마케팅 전략...")
    sua_result = sua.run(context, client)
    context["sua"] = sua_result
    save_file(output_dir, "07_마케팅_수아.md", sua_result)
    print_save_ok("07_마케팅_수아.md")

    # ── 리안 마케팅 토론 (상용화만) ──────────────────────────────
    if context.get("is_commercial", False):
        marketing_version = 1
        while True:
            print(f"\n{'='*60}")
            print(f"  마케팅 전략 v{marketing_version} 완료.")
            print(f"  수정할 거 있으면 말해줘. 없으면 'ok' 입력.")
            print(f"{'='*60}")
            print("리안: ", end="")
            feedback = input().strip()

            if feedback.lower() in ("ok", "ㅇㅇ", "진행해", "좋아", "괜찮아", "없어", ""):
                break

            marketing_version += 1
            context["sua_feedback"] = feedback
            context["previous_sua"] = context["sua"]
            print(f"\n[마케팅 v{marketing_version}] 피드백 반영해서 다시 작성할게...")
            sua_result = sua.run(context, client)
            context["sua"] = sua_result
            save_file(output_dir, f"07_마케팅_수아_v{marketing_version}.md", sua_result)
            print_save_ok(f"07_마케팅_수아_v{marketing_version}.md")

        context.pop("sua_feedback", None)
        context.pop("previous_sua", None)

    # ── 완료 + 새 터미널 자동 실행 ──────────────────────────────

    print(f"\n\n{'='*60}")
    print(f"  리안 컴퍼니 완료!")
    print(f"{'='*60}")
    print(f"\n  산출물: {output_dir}")
    print(f"\n  UltraProduct 터미널 자동으로 열게...")

    import subprocess
    abs_project_dir = os.path.abspath(project_dir)
    subprocess.Popen(
        f'start cmd /k "cd /d {abs_project_dir} && claude"',
        shell=True
    )

    print(f"\n  새 터미널 창이 열렸어.")
    print(f"  /work 입력하면 바로 시작돼.")
