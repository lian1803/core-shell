"""
직원 개별 호출 — 리안이 특정 직원한테 직접 물어볼 때 사용.

사용법:
  ./venv/Scripts/python.exe ask.py "서윤" "네이버 플레이스 시장 규모 알려줘"
  ./venv/Scripts/python.exe ask.py "민수" "이 수익모델 분석해줘"
  ./venv/Scripts/python.exe ask.py "하은" "이 주장 팩트체크 해줘"
  ./venv/Scripts/python.exe ask.py "준혁" "이 아이디어 GO/NO-GO 판단해줘"
  ./venv/Scripts/python.exe ask.py "태호" "요즘 AI 에이전트 트렌드 알려줘"
  ./venv/Scripts/python.exe ask.py "시은" "이 아이디어 정리 도와줘"

피드백:
  ./venv/Scripts/python.exe ask.py --feedback "서윤" "4" "이번 조사 좋았어"
성과 조회:
  ./venv/Scripts/python.exe ask.py --performance
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


def resolve_name(name_input: str) -> str | None:
    """이름 입력 → 모듈명 반환."""
    key = name_input.strip().lower()
    module_name = NAME_MAP.get(key) or NAME_MAP.get(key.rstrip("아야"))
    if not module_name:
        for k, v in NAME_MAP.items():
            if key in k or k in key:
                return v
    return module_name


def main():
    from knowledge.agent_memory import (
        load_agent_memory, save_work_log,
        save_feedback, record_task_start, print_performance_report
    )

    # 성과 조회 모드
    if len(sys.argv) >= 2 and sys.argv[1] == "--performance":
        print_performance_report()
        return

    # 피드백 모드: ask.py --feedback "서윤" "4" "이번 조사 좋았어"
    if len(sys.argv) >= 2 and sys.argv[1] == "--feedback":
        if len(sys.argv) < 5:
            print("사용법: ask.py --feedback '직원이름' '점수(1-5)' '피드백 내용'")
            sys.exit(1)
        name = sys.argv[2]
        score_str = sys.argv[3]
        feedback_text = " ".join(sys.argv[4:])
        try:
            score = int(score_str)
        except ValueError:
            score = None
        save_feedback(name, "직접 피드백", feedback_text, score)
        print(f"{name}에게 피드백 저장 완료. (점수: {score}/5)")
        return

    if len(sys.argv) < 3:
        print("사용법: ask.py '직원이름' '업무내용'")
        print("\n호출 가능한 직원:")
        print("  서윤  : 시장조사 (Perplexity)")
        print("  민수  : 전략/수익모델 (GPT-4o)")
        print("  하은  : 팩트체크/검증 (Gemini)")
        print("  준혁  : GO/NO-GO 판단 (Claude Opus)")
        print("  태호  : 트렌드 분석 (Claude Haiku)")
        print("  시은  : 아이디어 명확화 (Claude Sonnet)")
        print("\n피드백: ask.py --feedback '이름' '점수' '내용'")
        print("성과조회: ask.py --performance")
        sys.exit(1)

    name_input = sys.argv[1]
    task = " ".join(sys.argv[2:]).strip()

    module_name = resolve_name(name_input)
    if not module_name:
        print(f"'{name_input}' 직원을 찾을 수 없어.")
        sys.exit(1)

    # 한국어 이름 추출 (기록용)
    agent_name = name_input.rstrip("아야")

    # 모듈 임포트
    import importlib
    try:
        agent = importlib.import_module(f"agents.{module_name}")
    except ImportError as e:
        print(f"에이전트 로딩 실패: {e}")
        sys.exit(1)

    # 업무 시작 기록
    record_task_start(agent_name)

    # 과거 경험 로드
    memory = load_agent_memory(agent_name)

    # 컨텍스트 구성 (경험 포함)
    context = {
        "idea": task,
        "clarified": task,
        "task": task,
        "agent_memory": memory,  # 에이전트가 참고할 과거 경험
    }

    # Claude 클라이언트가 필요한 에이전트
    claude_agents = {"taeho", "sieun", "junhyeok"}
    client = get_anthropic_client() if module_name in claude_agents else None

    # 실행
    print(f"\n{'='*60}")
    print(f"직접 호출: {name_input} ({module_name})")
    if memory:
        print(f"[경험 로드됨 — 과거 기록 반영]")
    print(f"업무: {task}")
    print(f"{'='*60}")

    result = agent.run(context, client=client)

    # 업무 완료 기록
    result_summary = result[:300] if result else ""
    save_work_log(agent_name, task, result_summary, success=True)

    print(f"\n{'='*60}")
    print(f"완료 | 업무 기록 저장됨")
    print(f"피드백: ask.py --feedback '{agent_name}' '점수(1-5)' '피드백 내용'")
    print(f"{'='*60}")

    return result


if __name__ == "__main__":
    main()
