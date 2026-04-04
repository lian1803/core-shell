"""
인스타그램 피드 분석기
사용법: python analyze_instagram.py "https://www.instagram.com/p/XXX/"
"""
import sys
import os
import subprocess
import tempfile
import shutil
import base64
from pathlib import Path
from dotenv import load_dotenv
import google.genai as genai

load_dotenv()

COOKIE_FILE = Path(__file__).parent / "instagram_cookies.txt"
GALLERY_DL = Path(__file__).parent / "venv/Scripts/gallery-dl.exe"


def download_post(url: str, output_dir: Path) -> list[Path]:
    """gallery-dl로 이미지/영상 다운로드"""
    result = subprocess.run(
        [str(GALLERY_DL), "--cookies", str(COOKIE_FILE),
         "-D", str(output_dir), "--filename", "{num}.{extension}",
         url],
        capture_output=True, text=True
    )
    if result.returncode != 0 and "error" in result.stderr.lower():
        print(f"[오류] {result.stderr[:200]}")

    files = sorted(output_dir.glob("*"))
    return [f for f in files if f.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp", ".mp4", ".mov"}]


def get_caption(url: str) -> str:
    """캡션 텍스트 추출"""
    result = subprocess.run(
        [str(GALLERY_DL), "--cookies", str(COOKIE_FILE),
         "--print", "{description}", url],
        capture_output=True, text=True
    )
    return result.stdout.strip() or "(캡션 없음)"


def analyze_with_gemini(files: list[Path], caption: str, url: str) -> str:
    """Gemini Vision으로 콘텐츠 분석"""
    client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))

    image_files = [f for f in files if f.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"}]

    parts = []
    for img_path in image_files[:10]:
        with open(img_path, "rb") as f:
            data = f.read()
        parts.append(genai.types.Part.from_bytes(data=data, mime_type="image/jpeg"))

    prompt = f"""인스타그램 피드를 분석해줘.

[캡션]
{caption}

[분석 항목]
1. 이 계정은 뭘 하는 곳인가 (한 줄 요약)
2. 콘텐츠 구성 방식 (슬라이드 흐름, 디자인 패턴, 폰트/색상 스타일)
3. 카피라이팅 전략 (후킹 방식, 어투, 구조)
4. 우리 사업에 적용할 포인트 (온라인 마케팅 대행 / 콘텐츠 납품 관점에서)
5. 바로 훔쳐쓸 수 있는 것 (템플릿, 문구 구조, 포맷 등 구체적으로)

분석은 실무자 관점으로, 짧고 날카롭게. 이론 설명 말고 바로 쓸 수 있는 인사이트 위주로."""

    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=[prompt] + parts
    )
    return response.text


def save_report(url: str, analysis: str, caption: str):
    """보고사항들.md에 저장"""
    report_path = Path(__file__).parent.parent / "보고사항들.md"

    from datetime import datetime
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")

    entry = f"""
---
## [인스타 분석] 인스타 분석 — {timestamp}
**URL**: {url}

**원본 캡션**:
{caption[:300]}{"..." if len(caption) > 300 else ""}

**분석**:
{analysis}

"""
    with open(report_path, "a", encoding="utf-8") as f:
        f.write(entry)

    print(f"\n[완료] 보고사항들.md에 저장됨")


def main():
    if len(sys.argv) < 2:
        print("사용법: python analyze_instagram.py 'https://www.instagram.com/p/XXX/'")
        sys.exit(1)

    url = sys.argv[1]
    print(f"[다운로드] 다운로드 중: {url}")

    with tempfile.TemporaryDirectory() as tmp:
        tmp_path = Path(tmp)

        # 다운로드
        files = download_post(url, tmp_path)
        print(f"   → {len(files)}개 파일 다운로드됨")

        # 캡션
        caption = get_caption(url)
        print(f"   → 캡션: {caption[:80]}...")

        # 분석
        print("[분석] Gemini 분석 중...")
        analysis = analyze_with_gemini(files, caption, url)

        # 출력
        print("\n" + "="*60)
        print(analysis)
        print("="*60)

        # 저장
        save_report(url, analysis, caption)


if __name__ == "__main__":
    main()
