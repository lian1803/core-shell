"""
인스타 영상 분석기 — Gemini로 영상 내용 파악 + 리안 컴퍼니 업그레이드 관련성 판단
사용법: python -m lian_company.core.video_analyzer [폴더경로]
기본 폴더: LAINCP/업그레이드 해야할거
"""
import os
import sys
import time
import io

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

# Windows UTF-8 강제
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))

from google import genai
from google.genai import types

MODEL = "gemini-2.5-flash"
VIDEO_EXTENSIONS = {".mp4", ".mov", ".avi", ".mkv", ".webm", ".m4v"}

ANALYZE_PROMPT = """이 영상을 보고 아래 형식으로 분석해줘.

## 영상 요약
[영상이 다루는 핵심 내용 2-3줄]

## 핵심 개념/기법
[배울 수 있는 것들, 없으면 "없음"]

## 리안 컴퍼니 업그레이드 관련성
판정: [쓸만함 / 참고용 / 필요없음]
이유: [한 줄]

## 적용 포인트
[쓸만함/참고용이면 어디에 어떻게 쓸지, 필요없음이면 "스킵"]
"""


def get_video_files(folder: str) -> list:
    files = []
    for f in os.listdir(folder):
        ext = os.path.splitext(f)[1].lower()
        if ext in VIDEO_EXTENSIONS:
            files.append(os.path.join(folder, f))
    return sorted(files)


def analyze_video(client, video_path: str) -> dict:
    filename = os.path.basename(video_path)
    print(f"\n{'='*60}")
    print(f"  분석 중: {filename}")
    print(f"{'='*60}")

    # Gemini Files API로 업로드
    print("  [업로드 중...]", end="", flush=True)
    uploaded = client.files.upload(path=video_path)

    # 업로드 완료 대기
    while uploaded.state.name == "PROCESSING":
        time.sleep(2)
        uploaded = client.files.get(name=uploaded.name)

    if uploaded.state.name == "FAILED":
        return {"file": filename, "result": "업로드 실패", "verdict": "오류"}

    print(" 완료")
    print("  [분석 중...]")

    response = client.models.generate_content(
        model=MODEL,
        contents=[uploaded, ANALYZE_PROMPT],
    )

    result_text = response.text or ""
    print(result_text)

    # 판정 추출
    verdict = "알수없음"
    for line in result_text.splitlines():
        if "판정:" in line:
            if "쓸만함" in line:
                verdict = "쓸만함"
            elif "참고용" in line:
                verdict = "참고용"
            elif "필요없음" in line:
                verdict = "필요없음"
            break

    # 업로드된 파일 삭제 (비용 절약)
    try:
        client.files.delete(name=uploaded.name)
    except Exception:
        pass

    return {"file": filename, "result": result_text, "verdict": verdict}


def save_results(folder: str, results: list):
    output_path = os.path.join(folder, "_분석결과.md")
    lines = [f"# 인스타 영상 분석 결과\n\n"]

    useful = [r for r in results if r["verdict"] in ("쓸만함", "참고용")]
    skip = [r for r in results if r["verdict"] == "필요없음"]
    error = [r for r in results if r["verdict"] in ("오류", "알수없음")]

    lines.append(f"**총 {len(results)}개 | 쓸만함/참고용: {len(useful)}개 | 스킵: {len(skip)}개**\n\n")
    lines.append("---\n\n")

    for r in results:
        lines.append(f"## {r['file']}\n")
        lines.append(r["result"])
        lines.append("\n\n---\n\n")

    with open(output_path, "w", encoding="utf-8") as f:
        f.writelines(lines)

    print(f"\n[저장] {output_path}")
    return output_path


def main():
    # 기본 폴더
    default_folder = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
        "업그레이드 해야할거"
    )
    folder = sys.argv[1] if len(sys.argv) > 1 else default_folder

    if not os.path.isdir(folder):
        print(f"폴더 없음: {folder}")
        sys.exit(1)

    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        print("GOOGLE_API_KEY 없음. .env 확인해.")
        sys.exit(1)

    client = genai.Client(api_key=api_key)

    videos = get_video_files(folder)
    if not videos:
        print(f"영상 파일 없음: {folder}")
        sys.exit(0)

    print(f"\n총 {len(videos)}개 영상 발견")
    print("Gemini로 분석 시작...\n")

    results = []
    for i, video_path in enumerate(videos, 1):
        print(f"\n[{i}/{len(videos)}]", end="")
        try:
            result = analyze_video(client, video_path)
        except Exception as e:
            result = {"file": os.path.basename(video_path), "result": f"오류: {e}", "verdict": "오류"}
            print(f"\n오류: {e}")
        results.append(result)

    # 요약
    print(f"\n\n{'='*60}")
    print("  분석 완료")
    print(f"{'='*60}")
    useful = [r for r in results if r["verdict"] in ("쓸만함", "참고용")]
    skip = [r for r in results if r["verdict"] == "필요없음"]
    print(f"  쓸만함/참고용: {len(useful)}개")
    print(f"  필요없음:      {len(skip)}개")

    if useful:
        print("\n  [쓸만한 것들]")
        for r in useful:
            print(f"  - {r['file']} ({r['verdict']})")

    save_results(folder, results)


if __name__ == "__main__":
    main()
