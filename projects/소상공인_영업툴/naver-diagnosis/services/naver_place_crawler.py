"""
네이버 플레이스 크롤러
- 네이버 지역 검색 API로 업체 검색
- Playwright로 상세 페이지 크롤링
"""
import os
import re
import random
from typing import Optional, List, Dict, Any
import httpx
from playwright.async_api import Browser, Page
from dotenv import load_dotenv

load_dotenv()

# User-Agent 로테이션용 목록
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
]


class NaverPlaceCrawler:
    """네이버 플레이스 크롤러"""

    def __init__(self, browser: Browser):
        self.browser = browser
        self.client_id = os.getenv("NAVER_CLIENT_ID")
        self.client_secret = os.getenv("NAVER_CLIENT_SECRET")

    async def search_business(self, query: str) -> List[Dict[str, Any]]:
        """
        네이버 지역 검색 API로 업체 목록 반환.
        place_id는 크롤링 시점에 자동 검색.
        """
        api_url = "https://openapi.naver.com/v1/search/local.json"
        headers = {
            "X-Naver-Client-Id": self.client_id,
            "X-Naver-Client-Secret": self.client_secret,
        }
        params = {"query": query, "display": 5}

        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(api_url, headers=headers, params=params, timeout=10.0)
                resp.raise_for_status()
                data = resp.json()

            results = []
            for item in data.get("items", []):
                name = re.sub(r"<[^>]+>", "", item.get("title", ""))
                results.append({
                    "place_id": None,   # 크롤링 시 자동 검색
                    "name": name,
                    "address": item.get("address", ""),
                    "road_address": item.get("roadAddress", ""),
                    "category": item.get("category", ""),
                    "url": "",
                })
            return results

        except Exception as e:
            print(f"[Search] 오류: {e}")
            return []

    async def find_place_id(self, query: str) -> Optional[str]:
        """업체명으로 모바일 네이버 플레이스 검색 → place_id 추출"""
        import urllib.parse
        page = None
        try:
            context = await self.browser.new_context(
                user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
                viewport={"width": 390, "height": 844},
                locale="ko-KR",
            )
            page = await context.new_page()
            encoded = urllib.parse.quote(query)
            # 모바일 네이버 검색 → place URL로 리다이렉트됨
            await page.goto(f"https://m.search.naver.com/search.naver?query={encoded}&where=m_local", timeout=30000)
            await page.wait_for_load_state("domcontentloaded", timeout=15000)

            # 현재 URL 또는 페이지 내 place 링크에서 ID 추출
            current_url = page.url
            pid = self._extract_place_id(current_url)
            if pid:
                return pid

            # 페이지 내 place 링크 탐색
            for _ in range(6):
                await page.wait_for_timeout(500)
                links = await page.query_selector_all("a[href*='place/'], a[href*='local.naver']")
                for link in links:
                    href = await link.get_attribute("href") or ""
                    pid = self._extract_place_id(href)
                    if pid:
                        return pid

                # data-place-id 속성 확인 (6자리 이상만 유효)
                elements = await page.query_selector_all("[data-place-id]")
                for el in elements:
                    pid = await el.get_attribute("data-place-id")
                    if pid and pid.isdigit() and len(pid) >= 6:
                        return pid

        except Exception as e:
            print(f"[FindPlaceId] 오류: {e}")
        finally:
            if page:
                await page.close()
        return None

    async def crawl_from_search(self, query: str) -> Dict[str, Any]:
        """검색 결과 페이지에서 직접 데이터 추출 (상세 페이지 없이)"""
        import urllib.parse
        page = None
        result = {
            "place_id": None,
            "place_url": None,
            "photo_count": 0,
            "receipt_review_count": 0,
            "visitor_review_count": 0,
            "blog_review_count": 0,
            "has_menu": False,
            "has_hours": False,
            "has_price": False,
            "keywords": [],
            # 확장 필드
            "has_intro": False,
            "intro_text_length": 0,
            "has_directions": False,
            "directions_text_length": 0,
            "has_booking": False,
            "has_talktalk": False,
            "has_smartcall": False,
            "has_coupon": False,
            "has_news": False,
            "menu_count": 0,
            "has_menu_description": False,
            "has_owner_reply": False,
            "has_instagram": False,
            "has_kakao": False,
        }
        try:
            context = await self.browser.new_context(
                user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
                viewport={"width": 390, "height": 844},
                locale="ko-KR",
            )
            page = await context.new_page()
            encoded = urllib.parse.quote(query)
            url = f"https://m.search.naver.com/search.naver?query={encoded}&where=m_local"
            await page.goto(url, timeout=30000)
            await page.wait_for_load_state("networkidle", timeout=30000)

            text = await page.inner_text("body")
            content = await page.content()

            # 리뷰 수 추출 (검색 결과 페이지에서)
            review_data = self._extract_review_counts(text)
            result["visitor_review_count"] = review_data.get("visitor", 0)
            result["blog_review_count"] = review_data.get("blog", 0)

            # 사진 수 추출 (텍스트에서)
            result["photo_count"] = self._extract_photo_count(text)

            # 영업시간 확인
            result["has_hours"] = "영업" in text or "운영시간" in text

            # 메뉴 확인
            result["has_menu"] = "메뉴" in text

            # 가격 확인
            result["has_price"] = len(re.findall(r"[\d,]+\s*원", text)) >= 1

            # 키워드 추출 (iframe 포함 전체 HTML)
            all_html = await self._get_all_frames_html(page)
            result["keywords"] = self._extract_keywords(all_html)

            # ===== 확장 데이터 수집 =====
            # 소개/오시는 길
            intro_data = await self._check_intro_directions(page, text)
            result.update(intro_data)

            # 편의 기능
            conv_data = await self._check_convenience_features(page, text, all_html)
            result.update(conv_data)

            # 쿠폰/새소식
            cn_data = await self._check_coupon_news(page, text)
            result.update(cn_data)

            # 사장님 답글
            result["has_owner_reply"] = await self._check_owner_reply(page, text)

            # 메뉴 상세
            menu_data = await self._check_menu_detail(page, text, all_html)
            result.update(menu_data)

            # 외부 채널
            ext_data = self._check_external_channels(all_html, text)
            result.update(ext_data)

            # place_id 찾아서 /photo 페이지에서 사진 수 가져오기
            place_id = await self._extract_place_id_from_search(content)
            if place_id:
                result["place_id"] = place_id
                photo_count = await self._fetch_photo_count_from_photo_page(place_id)
                if photo_count > 0:
                    result["photo_count"] = photo_count

                # 키워드가 없으면 데스크톱 버전에서 시도
                if not result["keywords"]:
                    desktop_keywords = await self._fetch_keywords_from_desktop(place_id)
                    if desktop_keywords:
                        result["keywords"] = desktop_keywords

            print(f"[CrawlFromSearch] {query}: 사진={result['photo_count']}, 리뷰={result['visitor_review_count']}, 블로그={result['blog_review_count']}, 키워드={len(result['keywords'])}개")

        except Exception as e:
            print(f"[CrawlFromSearch] 오류: {e}")
        finally:
            if page:
                await page.close()
        return result

    def _extract_place_id(self, url: str) -> Optional[str]:
        """
        URL에서 place_id 추출

        Examples:
            https://map.naver.com/v5/entry/place/12345678 -> "12345678"
            https://place.map.naver.com/place/12345678 -> "12345678"
        """
        patterns = [
            r"place/(\d+)",
            r"entry/place/(\d+)",
        ]
        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                return match.group(1)
        return None

    async def _extract_place_id_from_search(self, html: str) -> Optional[str]:
        """검색 결과 HTML에서 첫 번째 place_id 추출"""
        # m.place.naver.com/place/12345678 또는 restaurant/12345678 패턴
        patterns = [
            r'm\.place\.naver\.com/place/(\d+)',
            r'm\.place\.naver\.com/restaurant/(\d+)',
            r'"placeId"\s*:\s*"?(\d+)"?',
        ]
        for pattern in patterns:
            match = re.search(pattern, html)
            if match:
                return match.group(1)
        return None

    async def crawl_place_detail(self, place_id: str) -> Dict[str, Any]:
        """
        Playwright로 플레이스 상세 정보 크롤링

        Args:
            place_id: 네이버 플레이스 ID

        Returns:
            크롤링 결과 딕셔너리
        """
        url = f"https://m.place.naver.com/place/{place_id}/home"
        user_agent = random.choice(USER_AGENTS)

        result = {
            "place_id": place_id,
            "place_url": url,
            "photo_count": 0,
            "receipt_review_count": 0,
            "visitor_review_count": 0,
            "blog_review_count": 0,
            "has_menu": False,
            "has_hours": False,
            "has_price": False,
            "keywords": [],
            # 확장 필드
            "has_intro": False,
            "intro_text_length": 0,
            "has_directions": False,
            "directions_text_length": 0,
            "has_booking": False,
            "has_talktalk": False,
            "has_smartcall": False,
            "has_coupon": False,
            "has_news": False,
            "menu_count": 0,
            "has_menu_description": False,
            "has_owner_reply": False,
            "has_instagram": False,
            "has_kakao": False,
        }

        page: Optional[Page] = None
        try:
            context = await self.browser.new_context(
                user_agent=user_agent,
                viewport={"width": 390, "height": 844},
                locale="ko-KR",
            )
            page = await context.new_page()
            await page.goto(url, timeout=30000)
            await page.wait_for_load_state("networkidle", timeout=30000)

            # 페이지 전체 텍스트 가져오기
            page_content = await page.content()
            page_text = await page.inner_text("body")

            # 사진 수 추출 (텍스트에서)
            result["photo_count"] = self._extract_photo_count(page_text)

            # 리뷰 수 추출
            review_data = self._extract_review_counts(page_text)
            result["receipt_review_count"] = review_data.get("receipt", 0)
            result["visitor_review_count"] = review_data.get("visitor", 0)
            result["blog_review_count"] = review_data.get("blog", 0)

            # 영업시간 존재 여부
            result["has_hours"] = await self._check_has_hours(page, page_text)

            # 메뉴 존재 여부
            result["has_menu"] = await self._check_has_menu(page, page_content)

            # 가격 정보 존재 여부
            result["has_price"] = self._check_has_price(page_text)

            # 키워드 추출 (iframe 포함 전체 HTML에서 keywordList 찾기)
            all_html = await self._get_all_frames_html(page)
            result["keywords"] = self._extract_keywords(all_html)

            # ===== 확장 데이터 수집 =====
            # 소개/오시는 길
            intro_data = await self._check_intro_directions(page, page_text)
            result.update(intro_data)

            # 편의 기능
            conv_data = await self._check_convenience_features(page, page_text, all_html)
            result.update(conv_data)

            # 쿠폰/새소식
            cn_data = await self._check_coupon_news(page, page_text)
            result.update(cn_data)

            # 사장님 답글
            result["has_owner_reply"] = await self._check_owner_reply(page, page_text)

            # 메뉴 상세
            menu_data = await self._check_menu_detail(page, page_text, all_html)
            result.update(menu_data)

            # 외부 채널
            ext_data = self._check_external_channels(all_html, page_text)
            result.update(ext_data)

            # 키워드가 없으면 데스크톱 버전에서 시도
            if not result["keywords"] and place_id:
                desktop_keywords = await self._fetch_keywords_from_desktop(place_id)
                if desktop_keywords:
                    result["keywords"] = desktop_keywords
                    print(f"[CrawlPlaceDetail] 데스크톱 버전에서 키워드 {len(desktop_keywords)}개 가져옴")

            # 사진 수가 0이면 /photo 페이지에서 다시 시도
            if result["photo_count"] == 0:
                photo_count = await self._fetch_photo_count_from_photo_page(place_id)
                if photo_count > 0:
                    result["photo_count"] = photo_count
                    print(f"[CrawlPlaceDetail] /photo 페이지에서 사진 수 가져옴: {photo_count}")

        except Exception as e:
            print(f"[NaverPlaceCrawler] 크롤링 오류: {e}")

        finally:
            if page:
                await page.close()

        return result

    async def _fetch_photo_count_from_photo_page(self, place_id: str) -> int:
        """
        /photo 페이지에서 사진 수 추출
        HTML에서 "SasImage","relation":"연관사진","total":N 패턴 찾기
        """
        page = None
        try:
            context = await self.browser.new_context(
                user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
                viewport={"width": 390, "height": 844},
                locale="ko-KR",
            )
            page = await context.new_page()

            # /photo 페이지 접근 (restaurant 또는 place 타입 모두 시도)
            photo_urls = [
                f"https://m.place.naver.com/restaurant/{place_id}/photo",
                f"https://m.place.naver.com/place/{place_id}/photo",
            ]

            for photo_url in photo_urls:
                try:
                    await page.goto(photo_url, timeout=30000)
                    await page.wait_for_load_state("networkidle", timeout=30000)

                    html = await page.content()

                    # "SasImage","relation":"연관사진","total":815 패턴 찾기
                    # 또는 더 간단하게 "total":N 앞에 SasImage나 연관사진이 있는 경우
                    pattern = r'SasImage[^}]*total["\s:]+(\d+)'
                    matches = re.findall(pattern, html)

                    if matches:
                        # 가장 큰 값 선택 (연관사진이 보통 가장 많음)
                        photo_count = max(int(m) for m in matches)
                        if photo_count > 0:
                            return photo_count

                    # 대체 패턴: "relation":"연관사진","total":N
                    pattern2 = r'"relation"\s*:\s*"[^"]*사진[^"]*"[^}]*"total"\s*:\s*(\d+)'
                    matches2 = re.findall(pattern2, html)
                    if matches2:
                        return max(int(m) for m in matches2)

                except Exception as e:
                    print(f"[_fetch_photo_count] URL {photo_url} 실패: {e}")
                    continue

        except Exception as e:
            print(f"[_fetch_photo_count] 오류: {e}")
        finally:
            if page:
                await page.close()
        return 0

    def _extract_keywords(self, html: str) -> List[str]:
        """
        HTML에서 keywordList 추출

        네이버 플레이스 API 응답에 포함된 keywordList 필드에서 키워드 추출
        예: "keywordList":["청담동카페","청담카페","청담동카페","커피엠스테이블","이스테이블카페"]
        """
        try:
            # keywordList 패턴 찾기 - JSON 배열 형태
            pattern = r'"keywordList"\s*:\s*\[([^\]]+)\]'
            match = re.search(pattern, html)
            if match:
                keyword_json = '[' + match.group(1) + ']'
                # JSON 파싱 (유니코드 이스케이프 자동 처리됨)
                import json
                keywords = json.loads(keyword_json)
                if isinstance(keywords, list):
                    return [kw for kw in keywords if isinstance(kw, str)][:10]
        except Exception as e:
            # 폴백: 정규식으로 직접 추출 (유니코드 이스케이프 형태)
            try:
                pattern = r'"keywordList"\s*:\s*\[(.*?)\]'
                match = re.search(pattern, html)
                if match:
                    # \\uXXXX 패턴 찾기
                    keywords = re.findall(r'"((?:[^"\\]|\\.)*)"', match.group(1))
                    # 유니코드 디코딩
                    import codecs
                    decoded_keywords = []
                    for kw in keywords[:10]:
                        try:
                            decoded = codecs.decode(kw, 'unicode_escape')
                            decoded_keywords.append(decoded)
                        except:
                            decoded_keywords.append(kw)
                    return decoded_keywords
            except:
                pass
        return []

    async def _get_all_frames_html(self, page) -> str:
        """메인 프레임 + 모든 iframe 콘텐츠를 합쳐서 반환 (keywordList가 iframe 안에 있음)"""
        html_parts = []
        try:
            html_parts.append(await page.content())
        except Exception:
            pass
        for frame in page.frames:
            try:
                frame_html = await frame.content()
                if "keywordList" in frame_html:
                    html_parts.insert(0, frame_html)  # keywordList 있는 프레임 우선
                else:
                    html_parts.append(frame_html)
            except Exception:
                pass
        return "\n".join(html_parts)

    async def _fetch_keywords_from_desktop(self, place_id: str) -> List[str]:
        """데스크톱 버전(pcmap)에서 키워드 추출"""
        page = None
        try:
            context = await self.browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125.0.0.0 Safari/537.36",
                viewport={"width": 1280, "height": 800},
                locale="ko-KR",
            )
            page = await context.new_page()

            # pcmap URL 시도 (restaurant 또는 place)
            urls = [
                f"https://pcmap.place.naver.com/restaurant/{place_id}",
                f"https://pcmap.place.naver.com/place/{place_id}",
            ]

            for url in urls:
                try:
                    await page.goto(url, timeout=30000)
                    await page.wait_for_load_state("networkidle", timeout=30000)

                    # iframe 포함 전체 HTML에서 keywordList 추출
                    html = await self._get_all_frames_html(page)
                    keywords = self._extract_keywords(html)
                    if keywords:
                        return keywords
                except Exception as e:
                    print(f"[_fetch_keywords_from_desktop] URL {url} 실패: {e}")
                    continue

        except Exception as e:
            print(f"[_fetch_keywords_from_desktop] 오류: {e}")
        finally:
            if page:
                await page.close()
        return []

    def _extract_photo_count(self, text: str) -> int:
        """사진 수 추출"""
        patterns = [
            r"사진\s*(\d+(?:\.\d+)?)\s*만",  # 사진 1.2만
            r"사진\s*(\d+)",
            r"이미지\s*(\d+)",               # 이미지 50
            r"(\d+(?:\.\d+)?)\s*만\s*장",    # 1.2만 장
            r"(\d+)\s*장",
            r"사진\s*\((\d+)\)",
            r"photo[s]?\s*(\d+)",            # English fallback
        ]
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                num_str = match.group(1)
                num = float(num_str)
                if "만" in pattern or (match.group(0) and "만" in match.group(0)):
                    num *= 10000
                return int(num)
        return 0

    def _extract_review_counts(self, text: str) -> Dict[str, int]:
        """리뷰 수 추출 (영수증, 방문자, 블로그) - '만' 단위, 쉼표 지원"""
        result = {"receipt": 0, "visitor": 0, "blog": 0}

        def parse_korean_number(match_obj) -> int:
            """정규식 매치에서 숫자 추출 ('만' 단위, 쉼표 처리)"""
            num_str = match_obj.group(1)
            # 쉼표 제거
            num_str = num_str.replace(",", "")
            num = float(num_str)
            # 전체 매치 텍스트에 '만'이 포함되어 있는지 확인
            full_text = match_obj.group(0)
            if "만" in full_text:
                num *= 10000
            return int(num)

        # 영수증리뷰 (쉼표 포함 패턴 추가)
        receipt_patterns = [
            r"영수증리뷰\s*([\d,]+(?:\.\d+)?)\s*만",
            r"영수증\s*리뷰\s*([\d,]+(?:\.\d+)?)\s*만",
            r"영수증리뷰\s*([\d,]+)",
            r"영수증\s*리뷰\s*([\d,]+)",
            r"영수증리뷰\s*\(([\d,]+)\)",
        ]
        for pattern in receipt_patterns:
            match = re.search(pattern, text)
            if match:
                result["receipt"] = parse_korean_number(match)
                break

        # 방문자리뷰
        visitor_patterns = [
            r"방문자리뷰\s*([\d,]+(?:\.\d+)?)\s*만",
            r"방문자\s*리뷰\s*([\d,]+(?:\.\d+)?)\s*만",
            r"방문자리뷰\s*([\d,]+)",
            r"방문자\s*리뷰\s*([\d,]+)",
            r"방문자리뷰\s*\(([\d,]+)\)",
            r"리뷰\s*([\d,]+(?:\.\d+)?)\s*만",
            r"리뷰\s*([\d,]+)",
        ]
        for pattern in visitor_patterns:
            match = re.search(pattern, text)
            if match:
                result["visitor"] = parse_korean_number(match)
                break

        # 블로그리뷰
        blog_patterns = [
            r"블로그리뷰\s*([\d,]+(?:\.\d+)?)\s*만",
            r"블로그\s*리뷰\s*([\d,]+(?:\.\d+)?)\s*만",
            r"블로그리뷰\s*([\d,]+)",
            r"블로그\s*리뷰\s*([\d,]+)",
            r"블로그\s*([\d,]+)",
        ]
        for pattern in blog_patterns:
            match = re.search(pattern, text)
            if match:
                result["blog"] = parse_korean_number(match)
                break

        return result

    async def _check_has_hours(self, page: Page, text: str) -> bool:
        """영업시간 정보 존재 여부"""
        keywords = ["영업시간", "영업 시간", "운영시간", "운영 시간", "매일", "월요일", "화요일"]
        for keyword in keywords:
            if keyword in text:
                return True

        # 셀렉터로도 확인
        try:
            element = await page.query_selector('[class*="time"], [class*="hour"], [class*="영업"]')
            if element:
                return True
        except Exception:
            pass

        return False

    async def _check_has_menu(self, page: Page, content: str) -> bool:
        """메뉴 정보 존재 여부"""
        # HTML content에서 메뉴 탭 확인
        menu_patterns = [
            r'href="[^"]*menu[^"]*"',
            r'"메뉴"',
            r'메뉴\s*탭',
            r'data-tab="menu"',
        ]
        for pattern in menu_patterns:
            if re.search(pattern, content, re.IGNORECASE):
                return True

        # 셀렉터로도 확인
        try:
            element = await page.query_selector('a[href*="menu"], [data-tab="menu"], button:has-text("메뉴")')
            if element:
                return True
        except Exception:
            pass

        return False

    def _check_has_price(self, text: str) -> bool:
        """가격 정보 존재 여부"""
        # 가격 패턴 (예: 15,000원, 8000원)
        price_pattern = r"[\d,]+\s*원"
        matches = re.findall(price_pattern, text)
        return len(matches) >= 2  # 2개 이상의 가격 정보가 있으면 True

    # ===== 확장 기능 메서드 (신규) =====

    async def _check_intro_directions(self, page, text: str) -> dict:
        """
        소개글과 오시는 길 정보 추출
        Returns: {has_intro, intro_text_length, has_directions, directions_text_length}
        """
        result = {
            "has_intro": False,
            "intro_text_length": 0,
            "has_directions": False,
            "directions_text_length": 0,
        }
        # 소개 키워드
        intro_keywords = ["소개", "매장 소개", "가게 소개", "업체 소개", "브랜드 소개", "우리 가게"]
        for kw in intro_keywords:
            if kw in text:
                result["has_intro"] = True
                # 소개 다음에 오는 텍스트 길이 추정 (최소 20자면 실제 내용 있다고 봄)
                idx = text.find(kw)
                nearby_text = text[idx:idx+200]
                result["intro_text_length"] = len(nearby_text.strip())
                break

        # 오시는 길 키워드
        direction_keywords = ["오시는 길", "찾아오시는", "교통", "주차", "지하철", "버스", "도보"]
        direction_count = sum(1 for kw in direction_keywords if kw in text)
        if direction_count >= 2:
            result["has_directions"] = True
            result["directions_text_length"] = direction_count * 30  # 추정

        return result

    async def _check_convenience_features(self, page, text: str, html: str) -> dict:
        """
        네이버 예약, 톡톡, 스마트콜 버튼 확인
        Returns: {has_booking, has_talktalk, has_smartcall}
        """
        result = {"has_booking": False, "has_talktalk": False, "has_smartcall": False}

        # 텍스트 기반 확인
        if "예약" in text or "booking" in html.lower() or "reservation" in html.lower():
            result["has_booking"] = True
        if "톡톡" in text or "talktalk" in html.lower():
            result["has_talktalk"] = True
        if "전화" in text or "스마트콜" in text or "smartcall" in html.lower():
            result["has_smartcall"] = True

        # 셀렉터 기반 확인
        try:
            booking_el = await page.query_selector('[class*="booking"], [class*="reserve"], a[href*="booking"]')
            if booking_el:
                result["has_booking"] = True
            talk_el = await page.query_selector('[class*="talktalk"], [class*="talk"], a[href*="talk"]')
            if talk_el:
                result["has_talktalk"] = True
            call_el = await page.query_selector('[class*="smartcall"], [class*="phone"], a[href*="tel:"]')
            if call_el:
                result["has_smartcall"] = True
        except Exception:
            pass

        return result

    async def _check_coupon_news(self, page, text: str) -> dict:
        """쿠폰, 새소식 존재 여부 확인"""
        result = {"has_coupon": False, "has_news": False}

        coupon_keywords = ["쿠폰", "할인", "이벤트", "혜택", "적립", "증정"]
        for kw in coupon_keywords:
            if kw in text:
                result["has_coupon"] = True
                break

        news_keywords = ["새소식", "공지", "소식", "업데이트", "알림"]
        for kw in news_keywords:
            if kw in text:
                result["has_news"] = True
                break

        return result

    async def _check_owner_reply(self, page, text: str) -> bool:
        """사장님 답글 존재 여부 확인"""
        reply_keywords = ["사장님", "답변", "감사합니다", "방문해주셔서", "찾아주셔서"]
        for kw in reply_keywords:
            if kw in text:
                return True
        try:
            el = await page.query_selector('[class*="owner"], [class*="reply"], [class*="ceo"]')
            if el:
                return True
        except Exception:
            pass
        return False

    async def _check_menu_detail(self, page, text: str, html: str) -> dict:
        """메뉴 개수 및 상세설명 여부 확인"""
        result = {"menu_count": 0, "has_menu_description": False}

        # 가격 패턴으로 메뉴 수 추정
        price_matches = re.findall(r"[\d,]+\s*원", text)
        result["menu_count"] = len(price_matches)

        # 메뉴 설명 텍스트 (20자 이상인 설명이 있으면)
        desc_patterns = [r'"description"\s*:\s*"([^"]{20,})"', r'메뉴.*?설명', r'재료.*?신선']
        for pattern in desc_patterns:
            if re.search(pattern, html):
                result["has_menu_description"] = True
                break

        return result

    def _check_external_channels(self, html: str, text: str) -> dict:
        """인스타그램, 카카오 채널 연동 여부 확인"""
        result = {"has_instagram": False, "has_kakao": False}

        if "instagram" in html.lower() or "instagram" in text.lower() or "인스타" in text:
            result["has_instagram"] = True
        if "kakao" in html.lower() or "카카오" in text or "채널" in text:
            result["has_kakao"] = True

        return result

    async def get_place_rank(self, keyword: str, place_id: str) -> int:
        """
        해당 키워드로 네이버 모바일 검색 시 플레이스 순위 반환
        못 찾으면 0 반환
        """
        import urllib.parse
        page = None
        try:
            context = await self.browser.new_context(
                user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
                viewport={"width": 390, "height": 844},
                locale="ko-KR",
            )
            page = await context.new_page()
            encoded = urllib.parse.quote(keyword)
            await page.goto(f"https://m.search.naver.com/search.naver?query={encoded}&where=m_local", timeout=30000)
            await page.wait_for_load_state("networkidle", timeout=20000)

            html = await page.content()

            # 전체 place ID 목록에서 위치 찾기
            all_ids = re.findall(r'(?:place/|placeId["\s:]+)(\d{7,})', html)
            unique_ids = []
            for pid in all_ids:
                if pid not in unique_ids:
                    unique_ids.append(pid)

            if place_id in unique_ids:
                return unique_ids.index(place_id) + 1

        except Exception as e:
            print(f"[get_place_rank] 오류: {e}")
        finally:
            if page:
                await page.close()
        return 0

    async def get_related_keywords(self, keyword: str) -> list:
        """
        네이버 자동완성 API로 연관 키워드 수집
        Returns: 연관 키워드 리스트 (최대 10개)
        """
        import urllib.parse
        try:
            encoded = urllib.parse.quote(keyword)
            url = f"https://ac.search.naver.com/nx/ac?q={encoded}&st=1&frm=nv&r_format=json&r_enc=UTF-8&r_unicode=0&t_koreng=1&run=2&rev=4"

            async with httpx.AsyncClient() as client:
                resp = await client.get(url, timeout=10.0, headers={
                    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
                    "Referer": "https://m.search.naver.com/",
                })
                if resp.status_code == 200:
                    data = resp.json()
                    items = data.get("items", [[]])[0] if data.get("items") else []
                    return [item[0] if isinstance(item, list) else item for item in items[:10]]
        except Exception as e:
            print(f"[get_related_keywords] 오류: {e}")
        return []
