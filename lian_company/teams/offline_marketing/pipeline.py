import os
import json
import anthropic
from datetime import datetime
from dotenv import load_dotenv
from teams.offline_marketing import researcher, strategist, copywriter, validator

load_dotenv()

TEAM_DIR = os.path.dirname(os.path.abspath(__file__))
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


def _read_current_state() -> dict:
    """현재 팀 산출물 + 피드백 전부 읽어서 상태 파악."""
    state = {}
    files = {
        "스크립트": "영업_스크립트_v2.md",
        "전략": "영업_전략_재설계.md",
        "검증": "영업_사업검증.md",
        "실전가이드": "영업_실전가이드_최종.md",
        "퍼널": "영업_퍼널_설계.md",
        "플레이북": "영업_플레이북.md",
    }
    for key, fname in files.items():
        path = os.path.join(OUTPUT_DIR, fname)
        try:
            with open(path, encoding="utf-8") as f:
                content = f.read()
            state[key] = {"exists": True, "preview": content[:500], "size": len(content)}
        except Exception:
            state[key] = {"exists": False}

    # 피드백 파일 확인
    feedback_path = os.path.join(OUTPUT_DIR, "_feedback.json")
    try:
        with open(feedback_path, encoding="utf-8") as f:
            state["feedback"] = json.load(f)
    except Exception:
        state["feedback"] = {}

    return state


def _self_assess(client, state: dict, mission: str) -> dict:
    """팀이 스스로 현재 상태 진단 → 이번 실행에서 뭘 집중할지 결정."""
    existing = [k for k, v in state.items() if isinstance(v, dict) and v.get("exists")]
    missing = [k for k, v in state.items() if isinstance(v, dict) and not v.get("exists") and k != "feedback"]
    feedback_text = str(state.get("feedback", {}))

    prompt = f"""너는 오프라인 마케팅팀 팀장이야.

=== 팀 미션 ===
{mission}

=== 현재 산출물 상태 ===
있는 것: {existing}
없는 것: {missing}

=== 최근 피드백 ===
{feedback_text if feedback_text != '{}' else '피드백 없음 (첫 실행 또는 아직 없음)'}

=== 지시 ===
지금 우리 팀이 가장 임팩트 있는 결과를 내려면 이번에 뭘 집중해야 하는지 판단해라.

반환 형식 (JSON만):
{{
  "assessment": "현재 상태 한 줄 요약",
  "priority": "이번 실행 최우선 과제 (research/strategy/copy/validation/full 중 하나)",
  "reason": "왜 이게 우선인지",
  "focus": "이번 실행에서 특히 집중할 포인트 (구체적으로)"
}}"""

    response = client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=500,
        messages=[{"role": "user", "content": prompt}]
    )
    text = response.content[0].text.strip()
    # JSON 파싱
    if "```" in text:
        text = text.split("```")[1].replace("json", "").strip()
    try:
        return json.loads(text)
    except Exception:
        return {"assessment": "판단 실패", "priority": "full", "reason": "자동 판단 불가", "focus": "전체 실행"}


def run(industry: str = "소상공인 네이버 플레이스 마케팅 대행"):
    client = get_client()
    context = {"industry": industry}

    print(f"\n{'='*60}")
    print(f"🏢 오프라인 마케팅 팀 자율 가동")
    print(f"{'='*60}")

    # ── 0. 미션 로드 ──────────────────────────────────────────
    mission_path = os.path.join(TEAM_DIR, "mission.md")
    try:
        with open(mission_path, encoding="utf-8") as f:
            mission = f.read()
    except Exception:
        mission = "소상공인 대상 카톡/문자 비대면 영업으로 월 5건 계약 달성"

    # ── 1. 현재 상태 파악 ─────────────────────────────────────
    print("\n[자가진단] 현재 팀 산출물 상태 파악 중...")
    state = _read_current_state()

    # 기존 자료 컨텍스트로 로드
    for key, info in state.items():
        if isinstance(info, dict) and info.get("exists"):
            context[f"current_{key}"] = info.get("preview", "")
    context["current_materials"] = context.get("current_스크립트", "")

    # ── 2. 자율 판단 — 이번에 뭘 집중할지 ────────────────────
    print("[자가진단] 이번 실행 우선순위 판단 중...")
    assessment = _self_assess(client, state, mission)
    priority = assessment.get("priority", "full")
    focus = assessment.get("focus", "")
    context["focus"] = focus
    context["assessment"] = assessment.get("assessment", "")

    print(f"\n📋 팀 자가진단 결과:")
    print(f"   현재 상태: {assessment.get('assessment', '')}")
    print(f"   이번 집중: {priority} — {assessment.get('reason', '')}")
    print(f"   포커스: {focus}")

    # ── 3. 우선순위에 따른 선택적 실행 ───────────────────────
    if priority in ("research", "full"):
        print("\n[1] 영업 전문가 자료 수집...")
        research = researcher.run(context)
        context["research"] = research
        save("_research_영업전문가자료.md", research)

    if priority in ("strategy", "full"):
        print("\n[2] 영업 전략 설계...")
        strategy = strategist.run(context, client)
        context["strategy"] = strategy
        save("영업_전략_재설계.md", strategy)

    if priority in ("copy", "full"):
        print("\n[3] 스크립트 + PPT 카피 생성...")
        copy = copywriter.run(context, client)
        context["copy"] = copy
        save("영업_스크립트_v2.md", copy)

    if priority in ("validation", "full"):
        print("\n[4] 현장 관점 검증...")
        validation = validator.run(context, client)
        context["validation"] = validation
        save("영업_사업검증.md", validation)

    # 부분 실행인 경우 단일 집중 실행
    if priority not in ("research", "strategy", "copy", "validation", "full"):
        print(f"\n[전체] 통합 실행 (판단값 '{priority}' 알 수 없어 전체 실행)...")
        research = researcher.run(context)
        context["research"] = research
        save("_research_영업전문가자료.md", research)
        strategy = strategist.run(context, client)
        context["strategy"] = strategy
        save("영업_전략_재설계.md", strategy)
        copy = copywriter.run(context, client)
        context["copy"] = copy
        save("영업_스크립트_v2.md", copy)
        validation = validator.run(context, client)
        context["validation"] = validation
        save("영업_사업검증.md", validation)

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
            f"- 재원: 영업 전문가 자료 수집 완료\n"
            f"- 승현: 영업 전략 재설계 완료 (운영 7개 항목 포함)\n"
            f"- 예진: DM 스크립트 + PPT 카피 완성\n"
            f"- 검증자: 현장 관점 사업 검증 완료\n\n"
            f"저장 위치: `{OUTPUT_DIR}`\n\n"
            f"리안, **영업_사업검증.md 먼저 봐줘.** "
            f"영업 시작 전에 고쳐야 할 것들 정리되어 있어."
        )
        write_report("재원/승현/예진/검증자", "오프라인 마케팅팀", report_content)

        # 피드백 수집
        collect_feedback("offline_marketing")
    except Exception as e:
        print(f"\n보고/저장 실패: {e}")

    print(f"\n{'='*60}")
    print("✅ 오프라인 마케팅 팀 완료")
    print(f"저장 위치: {OUTPUT_DIR}")
    print(f"{'='*60}")

    return context


# ── 자율 루프: 결과 수집 + 자동 개선 ────────────────────────────────────

def ingest_results(raw_text: str):
    """
    리안이 results.txt에 자유 형식으로 적은 결과를 파싱해서 status.json 업데이트.
    예: "미용실 거절, 이유: 비싸다"
        "포에트리헤어 계약 성사, 주목패키지"
        "3건 DM 발송, 1건 답장"
    """
    client = get_client()
    status_path = os.path.join(TEAM_DIR, "status.json")

    # 현재 status 로드
    if os.path.exists(status_path):
        with open(status_path, encoding="utf-8") as f:
            status = json.load(f)
    else:
        status = {
            "team": "offline_marketing",
            "last_updated": datetime.now().isoformat(),
            "kpi": {"계약전환율": None, "답장률": None, "클로징사이클_일": None, "월계약건수": 0},
            "current_version": "v1",
            "data_count": 0,
            "results_log": [],
            "last_improvement_reason": "초기 세팅",
            "next_action": "데이터 수집 대기"
        }

    # Claude Sonnet으로 자유 형식 파싱
    parse_prompt = f"""너는 영업팀 데이터 수집자야.

리안이 영업 결과를 자유 형식으로 적은 텍스트를 구조화된 JSON으로 변환해줘.

=== 입력 텍스트 ===
{raw_text}

=== 추출할 정보 ===
각 문장/라인에서:
- result_type: "계약" | "거절" | "DM발송" | "답장" | "기타"
- value: 숫자 (예: 거절이면 거절건수, DM발송이면 발송건수)
- reason: 거절 이유 (있으면), 기타 정보

=== 반환 형식 (JSON 배열) ===
[
  {{"result_type": "계약", "value": 1, "reason": "주목패키지 패턴"}},
  {{"result_type": "거절", "value": 1, "reason": "비싸다"}},
  {{"result_type": "DM발송", "value": 3, "reason": ""}},
  {{"result_type": "답장", "value": 1, "reason": ""}}
]

JSON 배열만 반환. 설명 없음."""

    response = client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=500,
        messages=[{"role": "user", "content": parse_prompt}]
    )
    text = response.content[0].text.strip()

    # JSON 파싱
    if "```" in text:
        text = text.split("```")[1].replace("json", "").strip()

    try:
        parsed_results = json.loads(text)
    except Exception as e:
        print(f"파싱 실패: {e}")
        parsed_results = []

    # ── status.json에 누적 ──
    for item in parsed_results:
        result_type = item.get("result_type", "기타")
        value = item.get("value", 1)
        reason = item.get("reason", "")

        status["results_log"].append({
            "timestamp": datetime.now().isoformat(),
            "type": result_type,
            "value": value,
            "reason": reason
        })

        # KPI 업데이트
        if result_type == "계약":
            current = status["kpi"].get("월계약건수") or 0
            status["kpi"]["월계약건수"] = current + value
        elif result_type == "DM발송":
            # DM 발송 추적용 (별도 처리)
            pass
        elif result_type == "답장":
            # 답장률 계산 (별도 처리)
            pass

    status["data_count"] = len(status["results_log"])
    status["last_updated"] = datetime.now().isoformat()

    # status.json 저장
    with open(status_path, "w", encoding="utf-8") as f:
        json.dump(status, f, ensure_ascii=False, indent=2)

    print(f"\n📊 결과 수집 완료: {status['data_count']}건")
    print(f"월 계약: {status['kpi']['월계약건수']}건")

    # ── 5건 이상이면 자동 improve() 실행 ──
    if status["data_count"] >= 5 and status["data_count"] % 5 == 0:
        print(f"\n🚀 데이터 {status['data_count']}건 도달. 자동 개선 시작...")
        improve()

    return status


def improve():
    """
    data_count >= 5일 때 자동 호출.
    약한 KPI 구간 분석 → 개선안 생성 → 파이프라인 재실행.
    """
    client = get_client()
    status_path = os.path.join(TEAM_DIR, "status.json")
    results_dir = os.path.join(TEAM_DIR, "results")
    os.makedirs(results_dir, exist_ok=True)

    # status.json 읽기
    if not os.path.exists(status_path):
        print("status.json이 없습니다. ingest_results()를 먼저 실행하세요.")
        return

    with open(status_path, encoding="utf-8") as f:
        status = json.load(f)

    results_log = status.get("results_log", [])
    if not results_log:
        print("분석할 데이터가 없습니다.")
        return

    print(f"\n{'='*60}")
    print(f"🔍 데이터 분석 및 개선 시작 (총 {len(results_log)}건)")
    print(f"{'='*60}")

    # ── 약한 KPI 구간 식별 ──
    contracts = [r for r in results_log if r["type"] == "계약"]
    rejections = [r for r in results_log if r["type"] == "거절"]
    rejection_reasons = {}
    for r in rejections:
        reason = r.get("reason", "미기입")
        rejection_reasons[reason] = rejection_reasons.get(reason, 0) + 1

    # ── 분석 프롬프트 생성 ──
    analysis_prompt = f"""너는 영업 전략 컨설턴트야.

=== 현재 데이터 ===
- 총 접촉: {len(results_log)}건
- 계약 성사: {len(contracts)}건
- 거절: {len(rejections)}건
- 계약 전환율: {(len(contracts) / len(results_log) * 100 if results_log else 0):.1f}%

=== 거절 사유 분석 ===
{json.dumps(rejection_reasons, ensure_ascii=False, indent=2)}

=== 과제 ===
데이터를 보면 가장 약한 부분이 뭔지 식별하고, 그 부분을 강화할 구체적인 개선안을 제시해줘.
예를 들어:
- 거절이 비싼 이유로 많으면 → 가격 정당화 스크립트 강화
- 답장이 없으면 → 첫 DM 오픈율 높이는 제목/내용
- 클로징이 늦으면 → 빠른 약속 취급 메시지 추가

=== 반환 형식 (JSON) ===
{{
  "weak_point": "가장 약한 KPI 이름 (예: 거절사유 비싼 것)",
  "impact": "이 부분이 전환율에 미치는 영향 (%)",
  "improvement_focus": "개선할 팀원 (researcher/strategist/copywriter/validator 중 하나)",
  "specific_actions": [
    "구체적 개선 액션 1",
    "구체적 개선 액션 2",
    "구체적 개선 액션 3"
  ],
  "expected_impact": "개선 후 예상 전환율 증대 (%)"
}}"""

    response = client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=800,
        messages=[{"role": "user", "content": analysis_prompt}]
    )
    text = response.content[0].text.strip()

    if "```" in text:
        text = text.split("```")[1].replace("json", "").strip()

    try:
        analysis = json.loads(text)
    except Exception as e:
        print(f"분석 실패: {e}")
        analysis = {"weak_point": "전체", "improvement_focus": "full", "specific_actions": []}

    print(f"\n📌 약한 포인트: {analysis.get('weak_point', '전체')}")
    print(f"📌 개선 필요 영역: {analysis.get('improvement_focus', 'full')}")
    print(f"📌 기대 효과: {analysis.get('expected_impact', '-')}%")

    # ── 개선 포커스 결정 ──
    improvement_focus = analysis.get("improvement_focus", "full")
    focus_text = f"데이터 기반 개선: {analysis.get('weak_point')}. 조치: {', '.join(analysis.get('specific_actions', [])[:2])}"

    # ── 파이프라인 재실행 (선택된 영역만) ──
    print(f"\n🔄 파이프라인 재실행 중 ({improvement_focus})...")

    # 버전 업그레이드
    old_version = status.get("current_version", "v1")
    version_num = int(old_version[1:]) + 1
    new_version = f"v{version_num}"

    context = {
        "industry": "소상공인 네이버 플레이스 마케팅 대행",
        "focus": focus_text,
        "improvement_actions": analysis.get("specific_actions", [])
    }

    # 선택적 재실행
    if improvement_focus in ("researcher", "full"):
        print("\n[1] 영업 전문가 자료 재수집...")
        research = researcher.run(context)
        save(f"_research_{new_version}.md", research)

    if improvement_focus in ("strategist", "full"):
        print("\n[2] 영업 전략 재설계...")
        strategy = strategist.run(context, client)
        save(f"영업_전략_{new_version}.md", strategy)

    if improvement_focus in ("copywriter", "full"):
        print("\n[3] 스크립트 재작성...")
        copy = copywriter.run(context, client)
        save(f"영업_스크립트_{new_version}.md", copy)

    if improvement_focus in ("validator", "full"):
        print("\n[4] 현장 검증...")
        validation = validator.run(context, client)
        save(f"영업_사업검증_{new_version}.md", validation)

    # ── 결과 저장 (results/ 폴더에 날짜별) ──
    improvement_result = {
        "timestamp": datetime.now().isoformat(),
        "version": new_version,
        "data_count_at_improvement": status["data_count"],
        "weak_point": analysis.get("weak_point"),
        "improvement_focus": improvement_focus,
        "actions_taken": analysis.get("specific_actions", []),
        "expected_impact": analysis.get("expected_impact")
    }

    result_filename = f"improvement_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    result_path = os.path.join(results_dir, result_filename)
    with open(result_path, "w", encoding="utf-8") as f:
        json.dump(improvement_result, f, ensure_ascii=False, indent=2)

    # ── status.json 업데이트 ──
    status["current_version"] = new_version
    status["last_improvement_reason"] = analysis.get("weak_point")
    status["last_updated"] = datetime.now().isoformat()

    with open(status_path, "w", encoding="utf-8") as f:
        json.dump(status, f, ensure_ascii=False, indent=2)

    # ── 보고 ──
    try:
        import sys
        sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
        from knowledge.manager import write_report

        actions_text = "".join([f"- {action}\n" for action in analysis.get("specific_actions", [])])
        report_content = (
            f"**데이터 기반 자동 개선** — {new_version}\n\n"
            f"- 수집 데이터: {status['data_count']}건\n"
            f"- 약한 포인트: {analysis.get('weak_point', 'N/A')}\n"
            f"- 개선 영역: {improvement_focus}\n"
            f"- 예상 효과: {analysis.get('expected_impact', 'N/A')}%\n\n"
            f"조치 내용:\n"
            f"{actions_text}\n"
            f"저장 위치: `{results_dir}`"
        )
        write_report("오프라인 마케팅팀", "자율 개선", report_content)
    except Exception as e:
        print(f"보고 실패: {e}")

    print(f"\n{'='*60}")
    print(f"✅ 개선 완료 ({new_version})")
    print(f"{'='*60}")
