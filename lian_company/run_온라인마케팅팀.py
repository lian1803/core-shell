import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

from teams.온라인마케팅팀.pipeline import run

if __name__ == "__main__":
    task = " ".join(sys.argv[1:]) if len(sys.argv) > 1 else "스마트스토어/쿠팡/인스타 셀러 대상 온라인 마케팅 대행 서비스 영업 — 잠재 고객 발굴 후 콜드메일/DM 초안까지"
    run(task)
