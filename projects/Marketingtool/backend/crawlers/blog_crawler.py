# Blog Crawler
"""
Naver Place blog/external channel information crawler
"""

from typing import Dict, Any
import time
import re

from crawlers.base import BaseCrawler
from selenium.webdriver.common.by import By


class BlogCrawler(BaseCrawler):
    """
    Crawler for blog and external channel information
    Uses robust selectors for better stability
    """

    def crawl(self, url: str) -> Dict[str, Any]:
        """
        Crawl blog/external channel information from place page

        Args:
            url: Naver Place URL

        Returns:
            Dict containing channel information
        """
        if not self.navigate_safely(url):
            return {"error": "Failed to navigate to page"}

        # Wait for page to load
        time.sleep(2)

        return {
            "blog_count": self._extract_blog_count(),
            "has_instagram": self._check_has_instagram(),
            "has_kakao_channel": self._check_has_kakao_channel(),
        }

    def _extract_blog_count(self) -> int:
        """Extract blog review count"""
        try:
            # Try multiple approaches

            # Method 1: Look for text containing blog count
            count_text_element = (
                self.find_element_by_text("블로그", partial=True) or
                self.find_element_by_text("건", partial=True) or
                self.find_element_by_attribute("span", "class", "blog")
            )

            if count_text_element:
                text = self.get_text_safely(count_text_element)
                if text:
                    # Extract number from text like "블로그 12건", "12", "123건"
                    match = re.search(r"\d+", text)
                    if match:
                        return int(match.group())

            # Method 2: Look for numeric indicator
            number_elements = self.find_elements_safely(
                By.CSS_SELECTOR, "[class*='blog'], [data-count]"
            )

            for elem in number_elements:
                text = self.get_text_safely(elem)
                if text:
                    match = re.search(r"\d+", text)
                    if match:
                        return int(match.group())

        except Exception as e:
            print(f"Error extracting blog count: {e}")

        return 0

    def _check_has_instagram(self) -> bool:
        """Check if Instagram is linked"""
        try:
            # Try multiple approaches

            # Method 1: Look for Instagram link in href
            instagram_link = self.find_element_by_attribute("a", "href", "instagram")
            if instagram_link:
                return True

            # Method 2: Look for instagram.com in any link
            all_links = self.find_elements_safely(By.TAG_NAME, "a")
            for link in all_links:
                href = self.get_attribute_safely(link, "href") or ""
                if "instagram.com" in href.lower():
                    return True

            # Method 3: Look for text containing "인스타" or "instagram"
            instagram_text = self.find_element_by_text("인스타", partial=True)
            if instagram_text or self.find_element_by_text("instagram", partial=True):
                return True

        except Exception:
            return False

    def _check_has_kakao_channel(self) -> bool:
        """Check if Kakao channel is linked"""
        try:
            # Try multiple approaches

            # Method 1: Look for Kakao channel link in href
            kakao_link = self.find_element_by_attribute("a", "href", "pf.kakao")
            if kakao_link:
                return True

            # Method 2: Look for channel.kakao.com in any link
            all_links = self.find_elements_safely(By.TAG_NAME, "a")
            for link in all_links:
                href = self.get_attribute_safely(link, "href") or ""
                if "channel.kakao.com" in href.lower() or "pf.kakao.com" in href.lower():
                    return True

            # Method 3: Look for text containing "카카오" or "kakao"
            kakao_text = self.find_element_by_text("카카오", partial=True)
            if kakao_text or self.find_element_by_text("채널", partial=True):
                # Found text containing "카카오" or "채널"
                return True

        except Exception:
            return False
