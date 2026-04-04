"""
ops_loop.py — Layer 4: 운영 루프

배포 후 매일/매주 돌아가는 자동 루프.
콘텐츠 생성 + 영업 메시지 + 성과 추적.

사용법:
    python -m core.ops_loop daily "프로젝트명"   # 매일 루프
    python -m core.ops_loop weekly "프로젝트명"  # 매주 루프

또는 코드에서:
    from core.ops_loop import daily_loop, weekly_loop
"""
import os
import sys
import anthropic
from datetime import datetime
from dotenv import load_dotenv
from core.context_loader import inject_context
from core.research_loop import research_before_task
from core.models import CLAUDE_SONNET
from core.self_improve import post_run_review

load_dotenv()

MODEL = CLAUDE_SONNET
REPORT_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "보고사항들.md")


def _get_client():
    return anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))


def _save_to_report(title: str, content: str):
    """보고사항들.md에 추가."""
    date_str = datetime.now().strftime("%Y-%m-%d %H:%M")
    entry = f"\n\n## {title} — {date_str}\n\n{content}\n\n---\n"
    try:
        existing = ""
        if os.path.exists(REPORT_PATH):
            with open(REPORT_PATH, encoding="utf-8") as f:
                existing = f.read()
        if "---" in existing:
            parts = existing.split("---", 1)
            new_content = parts[0] + "---\n" + entry + parts[1]
        else:
            new_content = existing + entry
        with open(REPORT_PATH, "w", encoding="utf-8") as f:
            f.write(new_content)
    except Exception as e:
        print(f"⚠️ 보고서 저장 실패: {e}")


def _load_project_context(project_name: str) -> str:
    """프로젝트 폴더에서 컨텍스트 로드."""
    team_root = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "team")
    # 프로젝트 폴더 찾기
    for folder in os.listdir(team_root):
        if project_name.lower() in folder.lower():
            project_dir = os.path.join(team_root, folder)
            context_parts = []
            for fname in ["CLAUDE.md", "PRD.md", "런칭준비.md"]:
                fpath = os.path.join(project_dir, fname)
                if os.path.exists(fpath):
                    with open(fpath, encoding="utf-8") as f:
                        context_parts.append(f.read()[:1000])
            return "\n\n".join(context_parts)
    return ""


# ── 매일 루프 ──────────────────────────────────────────────────

DAILY_CONTENT_PROMPT = """너는 리안 컴퍼니의 콘텐츠 팀이야. 매일 자동으로 콘텐츠를 생성해.

오늘 생성할 것:
1. **인스타 캡션 1개** — 프로젝트 컨셉에 맞는 훅 + 본문 + CTA. 해시태그 포함.
2. **블로그 포스트 제목 + 개요** — SEO 키워드 포함. 티스토리/네이버 대응.
3. **영업 DM 1개** — 오늘의 타겟에게 보낼 메시지. 짧고 임팩트.

각 콘텐츠는:
- 최신 트렌드 반영 (리서치 결과 참고)
- 우리 브랜드 톤에 맞게
- 바로 복붙해서 쓸 수 있는 완성본

출력 형식:
## 오늘의 인스타 캡션
[완성된 캡션 — 복붙 가능]

## 오늘의 블로그
- 제목: [SEO 최적화 제목]
- 키워드: [타겟 키워드 3개]
- 개요: [5줄 구조]

## 오늘의 영업 DM
[완성된 DM — 복붙 가능]
"""


def daily_loop(project_name: str):
    """매일 콘텐츠 생성 루프."""
    client = _get_client()
    print(f"\n{'='*60}")
    print(f"📅 매일 운영 루프: {project_name}")
    print(f"{'='*60}")

    project_context = _load_project_context(project_name)

    # 오늘의 트렌드 리서치
    research = research_before_task(
        role="콘텐츠 마케터",
        task=project_name,
        queries=[
            f"{project_name} 인스타그램 마케팅 트렌드 이번 주",
            f"{project_name} 블로그 SEO 키워드 2026",
        ]
    )

    user_msg = f"""프로젝트: {project_name}
날짜: {datetime.now().strftime('%Y-%m-%d (%A)')}

프로젝트 컨텍스트:
{project_context[:1500]}

최신 트렌드:
{research[:1500]}

오늘의 콘텐츠를 생성해줘."""

    full_response = ""
    with client.messages.stream(
        model=MODEL,
        max_tokens=2000,
        system=inject_context(DAILY_CONTENT_PROMPT),
        messages=[{"role": "user", "content": user_msg}],
        temperature=0.7,
    ) as stream:
        for text in stream.text_stream:
            print(text, end="", flush=True)
            full_response += text

    print()

    # 보고사항들.md에 저장
    _save_to_report(f"매일 운영 루프 ({project_name})", full_response)
    print(f"\n📋 보고사항들.md에 저장 완료")

    # 자기 점검
    try:
        post_run_review("매일 운영 루프", {"project": project_name}, full_response)
    except Exception:
        pass

    return full_response


# ── 매주 루프 ──────────────────────────────────────────────────

WEEKLY_REVIEW_PROMPT = """너는 리안 컴퍼니의 전략 분석가야. 매주 성과를 리뷰하고 다음 주 방향을 제안해.

분석할 것:
1. **이번 주 성과 요약** — 리안이 입력한 숫자 기반
2. **뭐가 잘 됐고 뭐가 안 됐는지** — 구체적으로
3. **다음 주 방향 제안** — 바꿀 것, 유지할 것, 새로 시도할 것
4. **콘텐츠 방향 수정** — 이번 주 반응 기반으로

출력 형식:
## 이번 주 성과
| 지표 | 수치 | 전주 대비 | 판단 |
|------|------|---------|------|

## 잘 된 것 / 안 된 것
- ✅ 잘 된 것: [구체적으로]
- ❌ 안 된 것: [구체적으로 + 원인 추정]

## 다음 주 방향
| 항목 | 액션 | 우선순위 |
|------|------|---------|

## 콘텐츠 방향 수정
[다음 주 인스타/블로그/DM 톤/주제 조정 제안]

숫자 없으면 숫자 없이 정성적으로 분석. 솔직하게."""


def weekly_loop(project_name: str, performance_data: str = ""):
    """매주 성과 리뷰 루프."""
    client = _get_client()
    print(f"\n{'='*60}")
    print(f"📊 매주 운영 루프: {project_name}")
    print(f"{'='*60}")

    project_context = _load_project_context(project_name)

    user_msg = f"""프로젝트: {project_name}
기간: 이번 주

프로젝트 컨텍스트:
{project_context[:1000]}

이번 주 성과 데이터:
{performance_data if performance_data else "(리안이 아직 입력 안 함 — 정성적 분석만)"}

매주 리뷰해줘."""

    full_response = ""
    with client.messages.stream(
        model=MODEL,
        max_tokens=2000,
        system=inject_context(WEEKLY_REVIEW_PROMPT),
        messages=[{"role": "user", "content": user_msg}],
        temperature=0.3,
    ) as stream:
        for text in stream.text_stream:
            print(text, end="", flush=True)
            full_response += text

    print()

    _save_to_report(f"주간 리뷰 ({project_name})", full_response)
    print(f"\n📋 보고사항들.md에 저장 완료")

    # 자기 점검
    try:
        post_run_review("주간 리뷰", {"project": project_name}, full_response)
    except Exception:
        pass

    return full_response


PIVOT_PROMPT = """너는 사업 전략가야.
팀이 3회 이상 KPI를 달성하지 못했을 때 피벗 방향을 제안해.

규칙:
- "안 됐습니다" 보고 금지. 반드시 "이렇게 바꿀게요" 제안
- 피벗 방향은 반드시 "더 좁히기" 위주 (범용화 절대 금지)
- 예: 전체 소상공인 → 강남 미용실만, 스마트스토어 전체 → 패션 카테고리만
- 피벗 후 기대 수치 반드시 포함

출력:
## 현재 문제 진단
[KPI 미달 원인 3가지]

## 피벗 방향 제안
### 1순위: [더 좁힌 타겟/방향]
- 왜: [이유]
- 기대 효과: [수치]

### 2순위: [다른 접근]
- 왜: [이유]
- 기대 효과: [수치]

## 즉시 실행 액션 (이번 주 안에)
1. [구체적 행동]
2. [구체적 행동]
"""


def pivot_check(project_name: str, kpi_history: list = None, weeks_failing: int = 3) -> str:
    """KPI 미달 감지 시 피벗 방향 자동 제안.

    사용법:
        pivot_check("오프라인 마케팅", weeks_failing=3)
        pivot_check("온라인납품팀", kpi_history=["답장률 15%", "전환율 3%"])
    """
    client = _get_client()

    print(f"\n{'='*60}")
    print(f"🔄 피벗 체크 | {project_name} ({weeks_failing}주 연속 미달)")
    print("="*60)

    kpi_text = "\n".join(kpi_history) if kpi_history else "(KPI 데이터 없음 — 정성적 판단)"

    user_msg = f"""프로젝트: {project_name}
연속 미달 기간: {weeks_failing}주

KPI 데이터:
{kpi_text}

피벗 방향 제안해줘."""

    full_response = ""
    with client.messages.stream(
        model=MODEL,
        max_tokens=1500,
        system=inject_context(PIVOT_PROMPT),
        messages=[{"role": "user", "content": user_msg}],
        temperature=0.3,
    ) as stream:
        for text in stream.text_stream:
            print(text, end="", flush=True)
            full_response += text

    print()
    _save_to_report(f"피벗 제안 ({project_name})", full_response)
    print(f"\n📋 보고사항들.md에 저장 완료")
    return full_response


# ── CLI ──────────────────────────────────────────────────────

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("사용법:")
        print('  python -m core.ops_loop daily "프로젝트명"')
        print('  python -m core.ops_loop weekly "프로젝트명" ["성과 데이터"]')
        print('  python -m core.ops_loop pivot "프로젝트명" [미달주수]')
        sys.exit(1)

    mode = sys.argv[1]
    project = sys.argv[2]

    if mode == "daily":
        daily_loop(project)
    elif mode == "weekly":
        perf = sys.argv[3] if len(sys.argv) > 3 else ""
        weekly_loop(project, perf)
    elif mode == "pivot":
        weeks = int(sys.argv[3]) if len(sys.argv) > 3 else 3
        pivot_check(project, weeks_failing=weeks)
    else:
        print(f"알 수 없는 모드: {mode}. daily / weekly / pivot 사용.")
