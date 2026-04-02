"""
직원 개별 호출 — 리안이 특정 직원한테 직접 물어볼 때 사용.

사용법:
  ./venv/Scripts/python.exe ask.py "서윤" "네이버 플레이스 시장 규모 알려줘"
  ./venv/Scripts/python.exe ask.py "민수" "이 수익모델 분석해줘"
  ./venv/Scripts/python.exe ask.py "하은" "이 주장 팩트체크 해줘"
  ./venv/Scripts/python.exe ask.py "준혁" "이 아이디어 GO/NO-GO 판단해줘"
  ./venv/Scripts/python.exe ask.py "태호" "요즘 AI 에이전트 트렌드 알려줘"
  ./venv/Scripts/python.exe ask.py "시은" "이 아이디어 정리 도와줘"
"""

import sys
import os
import io
from pathlib import Path
from dotenv import load_dotenv

# Windows 콘솔 UTF-8 출력
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

# 경로 설정
ROOT = Path(__file__).parent
sys.path.insert(0, str(ROOT))
load_dotenv(ROOT / ".env")


# 이름 → 모듈 매핑
NAME_MAP = {
    # 서윤 (Perplexity 시장조사)
    "서윤": "seoyun",
    "서윤아": "seoyun",
    "시장조사": "seoyun",
    "조사": "seoyun",

    # 민수 (GPT-4o 전략)
    "민수": "minsu",
    "민수야": "minsu",
    "전략": "minsu",
    "수익모델": "minsu",

    # 하은 (Gemini 팩트체크)
    "하은": "haeun",
    "하은아": "haeun",
    "팩트체크": "haeun",
    "검증": "haeun",

    # 준혁 (Claude Opus GO/NO-GO)
    "준혁": "junhyeok",
    "준혁아": "junhyeok",
    "go판단": "junhyeok",
    "판단": "junhyeok",

    # 태호 (Claude Haiku 트렌드)
    "태호": "taeho",
    "태호야": "taeho",
    "트렌드": "taeho",

    # 시은 (Claude Sonnet 오케스트레이터)
    "시은": "sieun",
    "시은아": "sieun",
}


def get_anthropic_client():
    import anthropic
    return anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))


def main():
    if len(sys.argv) < 3:
        print("사용법: ask.py '직원이름' '업무내용'")
        print("\n호출 가능한 직원:")
        print("  서윤  : 시장조사 (Perplexity)")
        print("  민수  : 전략/수익모델 (GPT-4o)")
        print("  하은  : 팩트체크/검증 (Gemini)")
        print("  준혁  : GO/NO-GO 판단 (Claude Opus)")
        print("  태호  : 트렌드 분석 (Claude Haiku)")
        print("  시은  : 아이디어 명확화 (Claude Sonnet)")
        sys.exit(1)

    name_input = sys.argv[1].strip().lower()
    task = " ".join(sys.argv[2:]).strip()

    # 이름 매핑
    module_name = NAME_MAP.get(name_input) or NAME_MAP.get(name_input.rstrip("아야"))
    if not module_name:
        # 부분 매칭 시도
        for key, val in NAME_MAP.items():
            if name_input in key or key in name_input:
                module_name = val
                break

    if not module_name:
        print(f"'{sys.argv[1]}' 직원을 찾을 수 없어.")
        print(f"가능한 이름: {', '.join(set(NAME_MAP.keys()))}")
        sys.exit(1)

    # 모듈 임포트
    import importlib
    try:
        agent = importlib.import_module(f"agents.{module_name}")
    except ImportError as e:
        print(f"에이전트 로딩 실패: {e}")
        sys.exit(1)

    # 컨텍스트 구성
    context = {
        "idea": task,
        "clarified": task,
        "task": task,
    }

    # Claude 클라이언트가 필요한 에이전트
    claude_agents = {"taeho", "sieun", "junhyeok"}
    client = get_anthropic_client() if module_name in claude_agents else None

    # 실행
    print(f"\n{'='*60}")
    print(f"직접 호출: {sys.argv[1]} ({module_name})")
    print(f"업무: {task}")
    print(f"{'='*60}")

    result = agent.run(context, client=client)

    print(f"\n{'='*60}")
    print("완료")
    print(f"{'='*60}")

    return result


if __name__ == "__main__":
    main()
