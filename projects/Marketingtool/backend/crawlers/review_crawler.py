# Review Crawler
"""
Naver Place review information crawler
"""

from typing import Dict, Any
import time
import re

from crawlers.base import BaseCrawler
from selenium.webdriver.common.by import By


class ReviewCrawler(BaseCrawler):
    """
    Crawler for review information
    Uses robust selectors for better stability
    """

    def crawl(self, url: str) -> Dict[str, Any]:
        """
        Crawl review information from place page

        Args:
            url: Naver Place URL

        Returns:
            Dict containing review information
        """
        if not self.navigate_safely(url):
            return {"error": "Failed to navigate to page"}

        # Wait for page to load
        time.sleep(2)

        return {
            "review_count": self._extract_review_count(),
            "has_owner_reply": self._check_has_owner_reply(),
            "recent_replies": self._count_recent_replies(),
        }

    def _extract_review_count(self) -> int:
        """Extract total review count"""
        try:
            # Try multiple approaches

            # Method 1: Look for text containing review count
            count_text_element = (
                self.find_element_by_text("리뷰", partial=True) or
                self.find_element_by_text("건", partial=True) or
                self.find_element_by_attribute("span", "class", "review")
            )

            if count_text_element:
                text = self.get_text_safely(count_text_element)
                if text:
                    # Extract number from text like "리뷰 45개", "123건", "45" etc.
                    match = re.search(r"\d+", text)
                    if match:
                        return int(match.group())

            # Method 2: Look for numeric indicator
            # Some pages show count as just a number or with icon
            number_elements = self.find_elements_safely(
                By.CSS_SELECTOR, "[class*='review'], [class*='count'], [data-count]"
            )

            for elem in number_elements:
                text = self.get_text_safely(elem)
                if text:
                    match = re.search(r"\d+", text)
                    if match:
                        return int(match.group())

        except Exception as e:
            print(f"Error extracting review count: {e}")

        return 0

    def _check_has_owner_reply(self) -> bool:
        """Check if owner has replied to reviews"""
        try:
            # Try multiple approaches to find owner replies

            # Method 1: Look for owner reply indicator by text
            reply_text = self.find_element_by_text("사장", partial=True)
            if reply_text:
                # Found text containing "사장", likely has replies
                return True

            # Method 2: Look for reply section
            reply_section = (
                self.find_element_by_attribute("div", "class", "reply") or
                self.find_element_by_attribute("div", "data-role", "owner") or
                self.find_element_by_text("답변", partial=True)
            )

            if reply_section:
                return True

            # Method 3: Check for specific owner marker
            owner_elements = self.find_elements_safely(
                By.CSS_SELECTOR, "[data-role='owner'], [class*='owner']"
            )

            return len(owner_elements) > 0

        except Exception:
            return False

    def _count_recent_replies(self) -> int:
        """Count recent owner replies (last 30 days)"""
        try:
            # Look for all owner reply elements
            reply_elements = (
                self.find_elements_safely(By.CSS_SELECTOR, "[data-role='owner']") or
                self.find_elements_safely(By.CSS_SELECTOR, "[class*='reply']") or
                self.find_elements_by_attribute("div", "class", "reply")
            )

            # Count replies with recent date indicator
            recent_count = 0
            for reply in reply_elements:
                # Check if reply has recent indicator
                parent = reply.find_element(By.XPATH, "..")
                if parent:
                    class_name = parent.get_attribute("class") or ""
                    class_name_lower = class_name.lower()

                    # Look for recent indicators
                    if any(indicator in class_name_lower for indicator in [
                        "recent", "today", "new", "latest"
                    ]):
                        recent_count += 1

            return recent_count

        except Exception:
            return 0
