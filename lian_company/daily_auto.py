"""
daily_auto.py — 리안 컴퍼니 매일 자동 실행 스크립트

Windows 작업 스케줄러에 등록하면 매일 아침 자동 실행.
리안이 직접 돌릴 필요 없음.
"""
import os
import sys
import io
from datetime import datetime

# 인코딩 설정
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

sys.path.insert(0, os.path.dirname(__file__))
from dotenv import load_dotenv
load_dotenv()

LOG_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "보고사항들.md")
# 실행 로그 — 스케줄러가 실제로 돌았는지 확인용
RUN_LOG_PATH = os.path.join(os.path.dirname(__file__), "daily_run.log")


def log(msg: str):
    timestamp = datetime.now().strftime("%H:%M:%S")
    line = f"[{timestamp}] {msg}"
    print(line)
    # 로그 파일에도 기록
    try:
        with open(RUN_LOG_PATH, "a", encoding="utf-8") as f:
            f.write(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {msg}\n")
    except Exception:
        pass


def main():
    log(f"=== 리안 컴퍼니 자동 실행 시작 ({datetime.now().strftime('%Y-%m-%d')}) ===")
    date_str = datetime.now().strftime("%Y-%m-%d %H:%M")
    results = []

    # ── 1단계: 전 팀 학습 ──────────────────────
    log("1단계: 전 팀 학습")
    try:
        from core.continuous_learning import learn_all_teams
        learn_all_teams()
        results.append("학습: 전 팀 학습 완료")
        log("학습 완료")
    except Exception as e:
        results.append(f"학습: 실패 ({e})")
        log(f"학습 실패: {e}")

    # ── 2단계: 운영 중인 프로젝트 일일 콘텐츠 생성 ────
    log("2단계: 일일 콘텐츠 생성")
    try:
        from core.ops_loop import daily_loop
        # team/ 폴더에서 활성 프로젝트 자동 감지
        team_root = os.path.join(os.path.dirname(os.path.dirname(__file__)), "team")
        active_projects = []
        if os.path.exists(team_root):
            for folder in os.listdir(team_root):
                folder_path = os.path.join(team_root, folder)
                # CLAUDE.md 또는 PRD.md 있으면 활성 프로젝트
                if os.path.isdir(folder_path) and any(
                    os.path.exists(os.path.join(folder_path, f))
                    for f in ["CLAUDE.md", "PRD.md", "런칭준비.md"]
                ):
                    active_projects.append(folder)

        if active_projects:
            for proj in active_projects[:3]:  # 하루 최대 3개 프로젝트
                log(f"  콘텐츠 생성: {proj}")
                try:
                    daily_loop(proj)
                    results.append(f"콘텐츠: {proj} 완료")
                except Exception as e:
                    results.append(f"콘텐츠: {proj} 실패 ({e})")
        else:
            log("  활성 프로젝트 없음 — 스킵")
            results.append("콘텐츠: 활성 프로젝트 없어서 스킵")
    except Exception as e:
        results.append(f"콘텐츠: 실패 ({e})")
        log(f"콘텐츠 생성 실패: {e}")

    # ── 3단계: 보고 ─────────────────────────────
    log("3단계: 보고 저장")
    report = f"\n\n## 자동 실행 — {date_str}\n\n"
    report += "\n".join(f"- {r}" for r in results)
    report += "\n\n---\n"

    try:
        existing = ""
        if os.path.exists(LOG_PATH):
            with open(LOG_PATH, encoding="utf-8") as f:
                existing = f.read()
        if "---\n\n## " in existing:
            parts = existing.split("---\n\n## ", 1)
            if len(parts) >= 2:
                new_content = parts[0] + "---\n" + report + "\n## " + parts[1]
            else:
                new_content = existing + report
        else:
            new_content = existing + report
        with open(LOG_PATH, "w", encoding="utf-8") as f:
            f.write(new_content)
        log("보고 저장 완료")
    except Exception as e:
        log(f"보고 저장 실패: {e}")

    log(f"=== 자동 실행 완료 ===")


if __name__ == "__main__":
    main()
