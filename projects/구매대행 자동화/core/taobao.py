# -*- coding: utf-8 -*-
"""타오바오: 옵션 선택 → 장바구니 담기"""

from playwright.sync_api import Page


def select_option(page: Page, option_text: str) -> bool:
    """
    옵션 텍스트로 타오바오 상품 옵션 선택
    예: "색상:E. 영화 베놈 더블 나이프-1개 (-2900원)"
    """
    if not option_text or option_text.strip() == "":
        print("옵션 없음 — 기본 상품")
        return True

    print(f"옵션 선택 시도: {option_text}")
    page.wait_for_timeout(2000)

    # 옵션 텍스트 정제 (마켓 표기 제거: "색상:E. ~" → "E. ~")
    clean = option_text
    if ":" in clean:
        # "색상:E. 베놈" → "E. 베놈"
        clean = clean.split(":", 1)[1].strip()
    # 괄호 안 가격 제거: "나이프-1개 (-2900원)" → "나이프-1개"
    import re
    clean = re.sub(r'\s*\([-+]?\d+원\)', '', clean).strip()
    print(f"  → 정제된 옵션: {clean}")

    # 타오바오 옵션 버튼/라디오 찾기
    # 1) 정확히 일치하는 span/li 클릭
    for sel in [
        f"span:has-text('{clean}')",
        f"li:has-text('{clean}')",
        f"[class*='sku']:has-text('{clean}')",
        f"[class*='option']:has-text('{clean}')",
        f"[class*='Sku']:has-text('{clean}')",
    ]:
        try:
            btn = page.locator(sel).first
            if btn.count() > 0 and btn.is_visible():
                btn.click(timeout=3000)
                print(f"[OK] 옵션 클릭: {clean}")
                page.wait_for_timeout(800)
                return True
        except Exception:
            continue

    print(f"[WARN] 정확한 옵션 못 찾음: {clean} — 수동 확인 필요")
    return False


def set_quantity(page: Page, quantity: int) -> bool:
    """수량 입력"""
    if quantity <= 1:
        return True

    print(f"수량 설정: {quantity}")
    try:
        # 수량 input 찾기
        qty_input = page.locator("input[type='number'], input[class*='amount'], input[class*='qty']").first
        if qty_input.count() > 0 and qty_input.is_visible():
            qty_input.triple_click(timeout=2000)
            qty_input.fill(str(quantity), timeout=2000)
            print(f"[OK] 수량 {quantity} 입력")
            return True
    except Exception as e:
        print(f"[WARN] 수량 입력 실패: {e}")

    return False


def add_to_cart(page: Page) -> bool:
    """장바구니 담기"""
    print("장바구니 담기...")
    page.wait_for_timeout(1000)

    for sel in [
        "button:has-text('加入购物车')",
        "button:has-text('放入购物车')",
        "[class*='cart']:has-text('加入')",
        "[class*='btn-cart']",
        "button[data-spm*='cart']",
        ".btn-cart",
        "#J_LinkBasket",
    ]:
        try:
            btn = page.locator(sel).first
            if btn.count() > 0 and btn.is_visible():
                btn.click(timeout=5000)
                print("[OK] 장바구니 담기 완료")
                page.wait_for_timeout(2000)
                return True
        except Exception:
            continue

    print("[WARN] 장바구니 버튼 못 찾음 — 수동 확인 필요")
    return False
