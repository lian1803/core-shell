"""
daily_auto.py — 리안 컴퍼니 매일 자동 실행 스크립트

Windows 작업 스케줄러에 등록하면 매일 아침 자동 실행.
리안이 직접 돌릴 필요 없음.

등록 방법 (1회만):
    1. Windows 검색 → "작업 스케줄러" 열기
    2. "작업 만들기" 클릭
    3. 이름: "리안컴퍼니 매일 자동"
    4. 트리거: 매일 오전 8시 (또는 컴퓨터 시작 시)
    5. 동작: 프로그램 시작
       - 프로그램: C:\\Users\\lian1\\Documents\\Work\\core\\lian_company\\venv\\Scripts\\python.exe
       - 인수: daily_auto.py
       - 시작 위치: C:\\Users\\lian1\\Documents\\Work\\core\\lian_company
    6. 조건: "컴퓨터의 AC 전원이 켜진 경우에만" 체크
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


def log(msg: str):
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"[{timestamp}] {msg}")


def main():
    log("리안 컴퍼니 매일 자동 실행 시작")
    date_str = datetime.now().strftime("%Y-%m-%d %H:%M")
    results = []

    # ── 1단계: 전 팀 학습 ──────────────────────
    log("1단계: 전 팀 학습 시작")
    try:
        from core.continuous_learning import learn_all_teams
        learn_all_teams()
        results.append("학습: 전 팀 학습 완료")
        log("학습 완료")
    except Exception as e:
        results.append(f"학습: 실패 ({e})")
        log(f"학습 실패: {e}")

    # ── 2단계: 자체 마케팅 콘텐츠 생성 ────────────
    log("2단계: 자체 마케팅 콘텐츠 생성")
    try:
        from core.ops_loop import daily_loop
        # 진행 중인 프로젝트가 있으면 콘텐츠 생성
        daily_loop("오프라인 마케팅")
        results.append("콘텐츠: 오프라인 마케팅 일일 콘텐츠 생성 완료")
        log("콘텐츠 생성 완료")
    except Exception as e:
        results.append(f"콘텐츠: 실패 ({e})")
        log(f"콘텐츠 생성 실패: {e}")

    # ── 3단계: 보고 ─────────────────────────────
    log("3단계: 보고사항 저장")
    report = f"\n\n## 자동 실행 — {date_str}\n\n"
    report += "\n".join(f"- {r}" for r in results)
    report += "\n\n---\n"

    try:
        existing = ""
        if os.path.exists(LOG_PATH):
            with open(LOG_PATH, encoding="utf-8") as f:
                existing = f.read()
        # Scorecard 섹션 바로 아래에 삽입
        if "---\n\n## " in existing:
            # 첫 번째 보고 항목 앞에 삽입
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

    log("매일 자동 실행 완료")


if __name__ == "__main__":
    main()
