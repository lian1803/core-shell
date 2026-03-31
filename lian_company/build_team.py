#!/usr/bin/env python3
"""
교육팀 — 신설 팀 자동 생성

사용법:
  python build_team.py "팀 이름" "팀이 해야 할 일"
  python build_team.py "구매대행 팀" "소싱, 주문 수집, 발주 자동화"
"""
import sys, os, io
sys.path.insert(0, os.path.dirname(__file__))
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

from dotenv import load_dotenv
load_dotenv()

from teams.education.pipeline import run

BANNER = """
======================================================
     리안 컴퍼니 — 교육팀 (팀 신설 시스템)
  Opus 커리큘럼 설계 → Perplexity 교육 → 팀 생성
======================================================
"""

if __name__ == "__main__":
    print(BANNER)

    if len(sys.argv) >= 3:
        team_name = sys.argv[1]
        team_purpose = " ".join(sys.argv[2:])
    elif len(sys.argv) == 2:
        team_name = sys.argv[1]
        print("이 팀이 해야 할 일:")
        team_purpose = input("> ").strip()
    else:
        print("신설할 팀 이름:")
        team_name = input("> ").strip()
        print("이 팀이 해야 할 일 (구체적으로):")
        team_purpose = input("> ").strip()

    run(team_name, team_purpose)
