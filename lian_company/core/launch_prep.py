"""
launch_prep.py — Layer 3: 런칭 준비 파이프라인

GO 판정 후, 개발/실행 전에 돌리는 단계.
"누구한테 뭘 얼마에 어떻게 팔건데?" 를 구체화한다.

사용법:
    from core.launch_prep import run_launch_prep
    result = run_launch_prep(context, client)

또는 직접 실행:
    python -m core.launch_prep "프로젝트 설명"
"""
import os
import sys
import io
if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')
import anthropic
from dotenv import load_dotenv
from core.context_loader import inject_context
from core.research_loop import research_before_task
from core.models import CLAUDE_SONNET

load_dotenv()

MODEL = CLAUDE_SONNET

LAUNCH_PREP_PROMPT = """너는 시은이야. 이사팀 GO 판정이 났고, 이제 런칭 준비를 해야 해.

개발/실행에 들어가기 전에 반드시 이것들을 구체화해야 해:

1. **타겟 구체화** — "소상공인"이 아니라 "월매출 500만 이상 네이버 스마트스토어 셀러" 수준으로
2. **경쟁사 상품/가격** — 실제 대행사들이 뭘 얼마에 파는지 (리서치 결과 참고)
3. **우리 상품 정의** — 우리가 팔 것 + 가격 + 포함 내용
4. **영업 채널** — DM? 이메일? 광고? 각 채널의 자동화 가능 여부 + 법적 제한
5. **마케팅 채널** — 인스타 컨셉, 블로그 플랫폼, 광고 예산
6. **첫 주 액션플랜** — 런칭 후 첫 7일 동안 매일 뭘 할건지

출력 형식:
## 1. 타겟
| 항목 | 내용 |
|------|------|
| 구체적 타겟 | |
| 타겟이 모이는 곳 | |
| 예상 TAM | |
| 얼리어답터 특성 | |

## 2. 경쟁사 벤치마크
| 경쟁사 | 상품 | 가격 | 우리 대비 약점 |
|--------|------|------|--------------|

## 3. 우리 상품
| 플랜 | 가격 | 포함 내용 | 타겟 등급 |
|------|------|---------|----------|

## 4. 영업 채널
| 채널 | 자동화 가능? | 법적 제한 | 우선순위 |
|------|------------|---------|---------|

## 5. 마케팅 채널
| 채널 | 컨셉/방향 | 비용 | 기대 효과 |
|------|---------|------|---------|

## 6. 첫 주 액션플랜
| Day | 할 것 | 담당 | 산출물 |
|-----|------|------|--------|

현실적으로. "이론적으로 가능"이 아니라 "내일 당장 이렇게"로."""


def run_launch_prep(context: dict, client: anthropic.Anthropic) -> str:
    """런칭 준비 파이프라인 실행."""
    print(f"\n{'='*60}")
    print("🚀 Layer 3: 런칭 준비")
    print("='*60")

    idea = context.get("clarified", context.get("idea", ""))
    strategy = context.get("minsu", "")[:500]
    market = context.get("seoyun", "")[:500]

    # 작업 전 리서치 — 경쟁사/트렌드 최신 수집
    research = research_before_task(
        role="런칭 준비",
        task=idea[:50],
        queries=[
            f"{idea[:30]} 경쟁사 가격 비교 2026",
            f"{idea[:30]} 마케팅 채널 전략 2026",
            f"{idea[:30]} 영업 자동화 방법",
        ]
    )

    user_msg = f"""프로젝트: {idea}

이사팀 전략 요약:
{strategy}

시장조사 요약:
{market}

최신 리서치:
{research[:2000]}

런칭 준비 구체화해줘."""

    full_response = ""
    with client.messages.stream(
        model=MODEL,
        max_tokens=3000,
        system=inject_context(LAUNCH_PREP_PROMPT),
        messages=[{"role": "user", "content": user_msg}],
        temperature=0.3,
    ) as stream:
        for text in stream.text_stream:
            print(text, end="", flush=True)
            full_response += text

    print()

    # 랜딩페이지 자동 생성 + Cloudflare 배포
    _deploy_landing_page(context, full_response)

    return full_response


def _deploy_landing_page(context: dict, launch_plan: str):
    """Stitch HTML 생성 후 Cloudflare Pages 자동 배포."""
    import subprocess, re, shutil, tempfile

    project_name = context.get("idea", "프로젝트")[:20].replace(" ", "-").replace("/", "-")
    slug = re.sub(r"[^a-z0-9-]", "", project_name.lower().replace(" ", "-"))[:30] or "lian-project"
    deploy_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
                              "team", project_name)
    os.makedirs(deploy_dir, exist_ok=True)

    html_path = os.path.join(deploy_dir, "index.html")
    if not os.path.exists(html_path):
        print(f"\n  ⚠️  index.html 없음 — Stitch 생성 필요 (Claude Code에서 실행)")
        return

    # Cloudflare Pages 배포
    print(f"\n  🌐 Cloudflare Pages 배포 중 ({slug})...")
    try:
        # 프로젝트 생성 시도 (이미 있으면 무시)
        subprocess.run(
            ["npx", "wrangler", "pages", "project", "create", slug, "--production-branch", "main"],
            capture_output=True, cwd=deploy_dir
        )
        result = subprocess.run(
            ["npx", "wrangler", "pages", "deploy", ".", "--project-name", slug, "--branch", "main"],
            capture_output=True, text=True, cwd=deploy_dir, timeout=120
        )
        if "Deployment complete" in result.stdout or "pages.dev" in result.stdout:
            url = re.search(r"https://[\w.-]+\.pages\.dev", result.stdout)
            url_str = url.group(0) if url else f"https://{slug}.pages.dev"
            print(f"  ✅ 배포 완료: {url_str}")
            # 보고사항들.md에 URL 기록
            report_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
                                       "보고사항들.md")
            try:
                entry = f"\n\n## 랜딩페이지 배포 완료\n\n- 프로젝트: {project_name}\n- URL: {url_str}\n\n---\n"
                existing = open(report_path, encoding="utf-8").read() if os.path.exists(report_path) else ""
                with open(report_path, "w", encoding="utf-8") as f:
                    f.write(existing + entry)
            except Exception:
                pass
            # QA 자동 실행
            try:
                from core.qa_loop import run_qa
                import time
                time.sleep(5)  # 배포 반영 대기
                run_qa(url_str, project_name)
            except Exception as e:
                print(f"  ⚠️  QA 스킵: {e}")
        else:
            print(f"  ⚠️  배포 실패: {result.stderr[:200]}")
    except Exception as e:
        print(f"  ⚠️  배포 오류: {e}")
