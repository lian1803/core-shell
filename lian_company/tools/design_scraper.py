"""
design_scraper.py — Awwwards SOTD 디자인 트렌드 자동 수집

역할:
- Playwright로 Awwwards SOTD 페이지 스크랩
- Gemini Vision으로 디자인 패턴 분석
- knowledge/base/design/trends/ 에 저장

실행:
    cd C:/Users/lian1/Documents/Work/core/lian_company
    ./venv/Scripts/python.exe tools/design_scraper.py
"""

import os
import json
import sys
from pathlib import Path
from datetime import datetime
import base64
import time

# 경로 설정
SCRIPT_DIR = Path(__file__).parent
LIAN_COMPANY_DIR = SCRIPT_DIR.parent
KNOWLEDGE_DIR = LIAN_COMPANY_DIR / "knowledge" / "base" / "design" / "trends"
TEMP_DIR = LIAN_COMPANY_DIR / "temp"

# 폴더 생성
KNOWLEDGE_DIR.mkdir(parents=True, exist_ok=True)
TEMP_DIR.mkdir(parents=True, exist_ok=True)

# 환경변수 로드
sys.path.insert(0, str(LIAN_COMPANY_DIR))
from dotenv import load_dotenv
load_dotenv(LIAN_COMPANY_DIR / ".env")

try:
    from playwright.async_api import async_playwright
    PLAYWRIGHT_AVAILABLE = True
except ImportError:
    PLAYWRIGHT_AVAILABLE = False
    print("⚠️  Playwright 미설치. pip install playwright 실행 후 다시 시도해주세요.")

try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    print("⚠️  google-generativeai 미설치. pip install google-generativeai 실행 후 다시 시도해주세요.")


def setup_gemini():
    """Gemini API 초기화."""
    if not GEMINI_AVAILABLE:
        return None

    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        print("⚠️  GOOGLE_API_KEY 환경변수 미설정")
        return None

    genai.configure(api_key=api_key)
    return genai


async def scrape_awwwards():
    """Awwwards SOTD 상위 사이트 5개 수집."""
    if not PLAYWRIGHT_AVAILABLE:
        return []

    sites = []
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            page = await browser.new_page()

            print("📌 Awwwards SOTD 접속 중...")
            await page.goto("https://www.awwwards.com/websites/sites_of_the_day/", timeout=30000)
            await page.wait_for_load_state("networkidle")

            # 사이트 정보 추출
            # Awwwards 페이지 구조에 맞춰 선택자 조정 (최신 구조 기준)
            site_elements = await page.query_selector_all("a[data-behavior='submission-link']")

            for i, elem in enumerate(site_elements[:5]):  # 상위 5개만
                try:
                    href = await elem.get_attribute("href")
                    title_elem = await elem.query_selector(".item-title, .submission-title, [class*='title']")
                    title = await title_elem.inner_text() if title_elem else f"Site {i+1}"
                    title = title.strip()

                    if href and title:
                        sites.append({"title": title, "url": href})
                        print(f"  ✓ {i+1}. {title}")
                except Exception as e:
                    print(f"  ⚠️  요소 추출 실패: {e}")

            await browser.close()

    except Exception as e:
        print(f"❌ Awwwards 스크랩 실패: {e}")

    return sites


async def take_screenshot(url: str, filename: str):
    """웹사이트 스크린샷 캡처."""
    if not PLAYWRIGHT_AVAILABLE:
        return None

    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            page = await p.browser.new_page(viewport={"width": 1200, "height": 800})

            print(f"  📸 {url} 스크린샷 중...")
            await page.goto(url, timeout=30000)
            await page.wait_for_load_state("networkidle")

            # 스크린샷 저장
            screenshot_path = TEMP_DIR / filename
            await page.screenshot(path=str(screenshot_path), full_page=False)

            await page.close()
            await browser.close()

            return screenshot_path

    except Exception as e:
        print(f"  ⚠️  스크린샷 실패: {e}")
        return None


def analyze_screenshot_with_gemini(image_path: Path):
    """Gemini Vision으로 스크린샷 분석."""
    if not GEMINI_AVAILABLE or not image_path.exists():
        return None

    try:
        # 이미지 읽기
        with open(image_path, "rb") as f:
            image_data = base64.standard_b64encode(f.read()).decode("utf-8")

        # Gemini Vision API 호출
        model = genai.GenerativeModel("gemini-2.0-flash-exp")

        prompt = """이 웹사이트 스크린샷을 보고 다음을 분석해줘:

1. **레이아웃 패턴** — 그리드 구조, 여백, 요소 정렬 방식
2. **색상 팔레트** — 주요 3색, 배경/텍스트 대비
3. **타이포그래피** — 폰트 스타일, 크기 계층
4. **인터랙션/모션** — 스크롤 애니메이션, 호버 효과 추측
5. **차별화 포인트** — 이 사이트만의 독특한 디자인 결정
6. **배울 것** — 우리가 적용할 수 있는 기법 1-2가지

한국어로 간결하게, 각 항목 2-3문장으로 작성해줘."""

        # 이미지를 base64로 전달
        response = model.generate_content([
            {
                "type": "image",
                "mime_type": "image/png",
                "data": image_data,
            },
            {
                "type": "text",
                "text": prompt,
            }
        ])

        return response.text

    except Exception as e:
        print(f"  ⚠️  Gemini 분석 실패: {e}")
        return None


def save_design_trend(sites_analysis: list[dict]):
    """분석 결과를 Markdown으로 저장."""
    if not sites_analysis:
        print("❌ 분석할 사이트가 없습니다.")
        return None

    now = datetime.now()
    filename = f"{now.strftime('%Y-%m-%d')}.md"
    filepath = KNOWLEDGE_DIR / filename

    # 마크다운 생성
    content = f"""# 디자인 트렌드 — {now.strftime('%Y-%m-%d')}

> Awwwards SOTD 자동 수집 (Gemini Vision 분석)

"""

    for i, site in enumerate(sites_analysis, 1):
        content += f"""## 사이트 {i}: {site['title']}

**URL:** {site['url']}

### 분석 결과

{site['analysis']}

---

"""

    # 파일 저장
    try:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"✅ 저장 완료: {filepath}")
        return filepath
    except Exception as e:
        print(f"❌ 저장 실패: {e}")
        return None


def cleanup_temp():
    """임시 파일 삭제."""
    try:
        for file in TEMP_DIR.glob("*.png"):
            file.unlink()
            print(f"  🗑️  임시 파일 삭제: {file.name}")
    except Exception as e:
        print(f"⚠️  임시 파일 삭제 실패: {e}")


async def main():
    """메인 파이프라인."""
    print("\n" + "="*60)
    print("🎨 Awwwards 디자인 트렌드 수집")
    print("="*60 + "\n")

    # 1. Awwwards SOTD 스크랩
    print("[1/4] Awwwards SOTD 스크랩 중...")
    sites = await scrape_awwwards()

    if not sites:
        print("❌ 사이트를 찾을 수 없습니다.")
        return

    print(f"✅ {len(sites)}개 사이트 발견\n")

    # 2. 스크린샷 캡처 + Gemini 분석
    print("[2/4] 스크린샷 캡처 + Gemini 분석 중...")
    sites_analysis = []

    for i, site in enumerate(sites, 1):
        print(f"\n  [{i}/{len(sites)}] {site['title']}")

        # 스크린샷 저장
        filename = f"site_{i:02d}.png"
        screenshot = await take_screenshot(site['url'], filename)

        if screenshot:
            # Gemini 분석
            print(f"  🔍 Gemini Vision 분석 중...")
            analysis = analyze_screenshot_with_gemini(screenshot)

            if analysis:
                sites_analysis.append({
                    'title': site['title'],
                    'url': site['url'],
                    'analysis': analysis
                })
                print(f"  ✅ 분석 완료")
            else:
                print(f"  ⚠️  분석 스킵")
        else:
            print(f"  ⚠️  스크린샷 스킵")

        # API 레이트 제한 회피
        time.sleep(2)

    # 3. 결과 저장
    print(f"\n[3/4] 결과 저장 중...")
    result_file = save_design_trend(sites_analysis)

    # 4. 임시 파일 정리
    print(f"\n[4/4] 임시 파일 정리 중...")
    cleanup_temp()

    # 최종 보고
    print("\n" + "="*60)
    print("✅ 디자인 트렌드 수집 완료!")
    print("="*60)
    if result_file:
        print(f"📌 저장 위치: {result_file}")
        print(f"📊 분석된 사이트: {len(sites_analysis)}개")


if __name__ == "__main__":
    # Windows에서 asyncio 이벤트 루프 정책 설정
    if sys.platform == "win32":
        import asyncio
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

    import asyncio
    asyncio.run(main())
