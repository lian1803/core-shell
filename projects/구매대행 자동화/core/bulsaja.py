# -*- coding: utf-8 -*-
"""불사자 자동화: BULSAJA.exe 자동 실행 + CDP 연결 → 판매자상품코드 검색 → 타오바오 이동"""

import os
import time
import subprocess
from pathlib import Path
from playwright.sync_api import Page, BrowserContext

MANAGE_URL = "https://www.bulsaja.com/products/manage/list"
DEBUG_PORT = 9222
BULSAJA_EXE = str(Path(os.environ["LOCALAPPDATA"]) / "Programs" / "bulsaja" / "BULSAJA.exe")


def launch_bulsaja():
    """BULSAJA.exe를 디버깅 포트로 실행 (이미 떠 있으면 재시작)"""
    subprocess.run(["taskkill", "/F", "/IM", "BULSAJA.exe"], capture_output=True)
    time.sleep(2)
    subprocess.Popen([BULSAJA_EXE, f"--remote-debugging-port={DEBUG_PORT}"])
    print("불사자 시작 중... (로그인 대기 20초)")
    time.sleep(20)


def connect_bulsaja(playwright):
    """BULSAJA.exe 자동 실행 후 CDP 연결"""
    # 먼저 이미 떠 있는지 확인
    try:
        browser = playwright.chromium.connect_over_cdp(f"http://localhost:{DEBUG_PORT}")
        print("[OK] 이미 실행 중인 불사자에 연결")
    except Exception:
        # 안 떠 있으면 직접 실행
        print("불사자 자동 실행 중...")
        launch_bulsaja()
        try:
            browser = playwright.chromium.connect_over_cdp(f"http://localhost:{DEBUG_PORT}")
        except Exception as e:
            raise RuntimeError(
                f"불사자 연결 실패: {e}\n"
                f"→ 불사자 경로 확인: {BULSAJA_EXE}"
            )

    context = browser.contexts[0]

    # 현재 열린 페이지 중 manage/list 찾기
    page = None
    for p in context.pages:
        if "manage" in (p.url or ""):
            page = p
            break

    if page is None:
        page = context.pages[0] if context.pages else context.new_page()
        print("상품관리 페이지로 이동...")
        page.goto(MANAGE_URL, wait_until="domcontentloaded", timeout=30000)
        page.wait_for_timeout(3000)

    print(f"[OK] 연결됨: {page.url}")
    return browser, context, page


def close_popups(page: Page):
    """팝업/공지 닫기"""
    for sel in [
        "button:has-text('다시보지 않기')",
        "button:has-text('닫기')",
        "button:has-text('Close')",
        "[aria-label='Close']",
        "button.modal-close",
    ]:
        try:
            btn = page.locator(sel).first
            if btn.count() > 0 and btn.is_visible(timeout=1000):
                btn.click(timeout=2000)
                page.wait_for_timeout(500)
        except Exception:
            continue


def go_to_manage_page(page: Page):
    if "manage/list" not in (page.url or ""):
        page.goto(MANAGE_URL, wait_until="domcontentloaded", timeout=30000)
        page.wait_for_timeout(3000)
    close_popups(page)
    # ag-grid 로드 대기
    try:
        page.wait_for_selector("div.ag-row", timeout=15000)
    except Exception:
        pass


def search_product(page: Page, seller_code: str) -> bool:
    """수집상품 빠른검색에 판매자상품코드 입력"""
    search_code = seller_code.split(":")[0] if ":" in seller_code else seller_code
    print(f"  검색: {search_code}")

    close_popups(page)
    page.wait_for_timeout(1000)

    for sel in [
        "input.ag-input-field-input.ag-text-field-input",
        "input[class*='ag-'][class*='text']",
        "input[aria-label*='빠른검색']",
        "input[placeholder*='빠른검색']",
        "input[placeholder*='검색']",
        "input[placeholder*='Search']",
        "input[type='search']",
        ".ag-floating-filter-input input",
        ".ag-header-cell input",
    ]:
        try:
            inp = page.locator(sel).first
            if inp.count() > 0 and inp.is_visible(timeout=1000):
                inp.click(timeout=2000)
                inp.fill("", timeout=1000)
                inp.type(search_code, delay=50)
                page.keyboard.press("Enter")
                page.wait_for_timeout(2000)
                print(f"  [OK] 검색 완료 (selector: {sel})")
                return True
        except Exception:
            continue

    # 디버그: 스크린샷 저장
    try:
        page.screenshot(path="debug_search_fail.png")
        print(f"  [WARN] 검색창 못 찾음 — debug_search_fail.png 저장됨")
    except Exception:
        print(f"  [WARN] 검색창 못 찾음")
    return False


def get_taobao_url(page: Page, context: BrowserContext) -> str | None:
    """불사자에서 타오바오 URL만 뽑기 (F1 → 탭 열고 URL 확인 후 닫기)"""
    print("  타오바오 URL 추출 중...")
    page.wait_for_timeout(1500)

    # 행 클릭
    try:
        first_row = page.locator("div.ag-row").first
        if first_row.count() > 0:
            first_row.click(timeout=3000)
            page.wait_for_timeout(500)
    except Exception:
        pass

    # 방법 1: 링크 href 직접 읽기 (탭 안 열어도 됨)
    for sel in [
        "a[href*='taobao.com']",
        "a[href*='tmall.com']",
        "a[href*='1688.com']",
    ]:
        try:
            link = page.locator(sel).first
            if link.count() > 0:
                href = link.get_attribute("href", timeout=2000)
                if href:
                    print(f"  [OK] URL 추출 (링크): {href[:60]}...")
                    return href
        except Exception:
            continue

    # 방법 2: F1 → 새 탭 열고 URL 읽은 뒤 닫기
    try:
        with context.expect_page(timeout=10000) as new_page_info:
            page.keyboard.press("F1")
        tmp = new_page_info.value
        tmp.wait_for_load_state("domcontentloaded", timeout=30000)
        url = tmp.url
        tmp.close()
        print(f"  [OK] URL 추출 (F1): {url[:60]}...")
        return url
    except Exception as e:
        print(f"  [WARN] URL 추출 실패: {e}")

    return None


def open_taobao_page(page: Page, context: BrowserContext):
    """(레거시) 불사자 브라우저에서 타오바오 탭 열기 — get_taobao_url 권장"""
    url = get_taobao_url(page, context)
    if url is None:
        return None

    taobao_page = context.new_page()
    taobao_page.goto(url, wait_until="domcontentloaded", timeout=30000)
    return taobao_page
