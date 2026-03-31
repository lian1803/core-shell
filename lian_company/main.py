#!/usr/bin/env python3
"""
리안 컴퍼니 — AI 멀티에이전트 기획 자동화 시스템

사용법:
  python main.py                          # 대화형 모드
  python main.py "소상공인 AI 상세페이지"   # 직접 입력 모드
"""
import sys
import os
import io

# 프로젝트 루트를 경로에 추가
sys.path.insert(0, os.path.dirname(__file__))

# Windows UTF-8 강제 설정
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

from dotenv import load_dotenv
load_dotenv()

from agents import sieun
from core.pipeline import run_pipeline, get_client
from core.notifier import notify_pipeline_start


BANNER = """
======================================================
          리안 컴퍼니 (LIAN COMPANY)
    아이디어 -> 설계서 자동 완성 AI 시스템
======================================================
"""


def main():
    print(BANNER)

    # API 키 확인
    try:
        client = get_client()
    except ValueError as e:
        print(f"❌ {e}")
        sys.exit(1)

    # 아이디어 받기
    if len(sys.argv) > 1:
        idea = " ".join(sys.argv[1:])
        print(f"💡 아이디어: {idea}\n")
        interactive = False
    else:
        print("💡 아이디어를 입력해줘 (엔터로 제출):")
        print("리안: ", end="")
        idea = input().strip()
        if not idea:
            print("아이디어를 입력해야 해.")
            sys.exit(1)
        interactive = True

    # 시은: 아이디어 명확화
    sieun_result = sieun.run(idea, client, interactive=interactive)

    # 이사팀 자동 실행 (더 이상 확인 안 함)
    print(f"\n{'='*60}")
    print("이사팀 자동 실행 중...")

    # 디스코드 알림
    notify_pipeline_start(idea)

    # 파이프라인 실행
    run_pipeline(sieun_result)


if __name__ == "__main__":
    main()
