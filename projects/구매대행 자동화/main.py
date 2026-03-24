# -*- coding: utf-8 -*-
"""
구매대행 자동화
실행: python main.py 구대.xlsx
"""
import sys
from playwright.sync_api import sync_playwright

from core.order import load_orders
from core.bulsaja import connect_bulsaja, go_to_manage_page, search_product, get_taobao_url
from core.taobao import select_option, set_quantity, add_to_cart


def run(excel_path: str):
    orders = load_orders(excel_path)
    print(f"\n총 {len(orders)}건 주문 로드\n")

    with sync_playwright() as p:
        # 불사자 연결 (자동 실행 포함)
        print("불사자 연결 중...")
        browser, bulsaja_ctx, page = connect_bulsaja(p)
        go_to_manage_page(page)

        for order in orders:
            print(f"\n{'='*50}")
            print(f"[{order.row_num}] {order.product_name}")
            print(f"  옵션: {order.option or '없음'}")
            print(f"  수량: {order.quantity}")
            print(f"  업체코드: {order.seller_code}")
            print(f"  마켓: {order.market}")

            # 1. 불사자에서 검색
            if not search_product(page, order.seller_code):
                print("  → 검색 실패, 건너뜀")
                continue

            # 2. 타오바오 URL 추출
            taobao_url = get_taobao_url(page, bulsaja_ctx)
            if taobao_url is None:
                print("  → 타오바오 URL 추출 실패, 건너뜀")
                continue

            # 3. 불사자 컨텍스트에서 타오바오 열기
            taobao = bulsaja_ctx.new_page()
            taobao.goto(taobao_url, wait_until="domcontentloaded", timeout=30000)
            taobao.wait_for_timeout(2000)

            # 4. 옵션 선택
            select_option(taobao, order.option)

            # 5. 수량
            set_quantity(taobao, order.quantity)

            # 6. 장바구니
            ok = add_to_cart(taobao)

            if ok:
                print(f"  ✓ 완료: {order.product_name}")
            else:
                print(f"  ✗ 장바구니 실패 — 수동 확인 필요")

            # 탭 열어둠 (수동 확인 가능하도록)
            # taobao.close()

        print(f"\n{'='*50}")
        print("전체 처리 완료. 브라우저는 유지됩니다.")
        try:
            input("종료하려면 Enter...")
        except EOFError:
            pass
        browser.disconnect()


if __name__ == "__main__":
    excel = sys.argv[1] if len(sys.argv) > 1 else "구대.xlsx"
    run(excel)
