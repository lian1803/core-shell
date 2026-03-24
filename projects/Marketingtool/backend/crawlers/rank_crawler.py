# Rank Crawler
"""
Naver mobile search rank crawler
"""

from typing import Optional, Dict, Any
import time
import re

from crawlers.base import BaseCrawler
from selenium.webdriver.common.by import By


class RankCrawler(BaseCrawler):
    """
    Crawler for current rank in mobile search
    Uses robust selectors for better stability
    """

    def crawl(self, business_name: str) -> Dict[str, Any]:
        """
        Crawl current rank from mobile search

        Args:
            business_name: Business name to search

        Returns:
            Dict containing rank information
        """
        search_url = f"https://m.search.naver.com/search.naver?query={business_name}"

        if not self.navigate_safely(search_url, wait_for_load=False):
            return {"error": "Failed to navigate to search page"}

        # Wait for search results
        time.sleep(3)

        return {
            "rank": self._extract_rank(business_name),
            "page": self._extract_page(),
            "screenshot": self.capture_screenshot(f"rank_{business_name.replace(' ', '_')}"),
        }

    def _extract_rank(self, business_name: str) -> int:
        """
        Extract rank position
        Returns position number (1-based) or -1 if not found
        """
        try:
            # Find all place listings in search results - try multiple selectors
            listings = (
                self.find_elements_safely(By.CSS_SELECTOR, "[class*='place']") or
                self.find_elements_safely(By.CSS_SELECTOR, "[data-gcl-click-target]") or
                self.find_elements_safely(By.CSS_SELECTOR, ".place_list li") or
                self.find_elements_safely(By.CSS_SELECTOR, "section div[class*='']")
            )

            if not listings:
                # Try to find by business name text
                listing = self.find_element_by_text(business_name, partial=True)
                if listing:
                    # Found exact match, but we can't determine position
                    return 1
                return -1

            # Find which listing matches business name
            for index, listing in enumerate(listings, start=1):
                # Get text content of the listing
                listing_text = self.get_text_safely(listing) or ""

                # Check if business name is in the listing text
                # Normalize both strings for better matching
                business_normalized = business_name.lower().strip()
                listing_normalized = listing_text.lower().strip()

                # Check for partial match (handling variations like extra text)
                if business_normalized in listing_normalized or listing_normalized in business_normalized:
                    return index

                # Also check title/h1 within the listing
                title_elem = listing.find_element(By.TAG_NAME, "h1") if listing else None
                if title_elem:
                    title_text = title_elem.text.strip().lower()
                    if business_normalized in title_text or title_text in business_normalized:
                        return index

        except Exception as e:
            print(f"Error extracting rank: {e}")

        return -1

    def _extract_page(self) -> int:
        """
        Extract page number from search results
        Default is page 1
        """
        try:
            # Look for pagination indicator - try multiple approaches
            page_element = (
                self.find_element_by_text("페이지", partial=True) or
                self.find_element_by_attribute("span", "class", "page") or
                self.find_element_safely(By.CSS_SELECTOR, "[data-page]")
            )

            if page_element:
                text = self.get_text_safely(page_element)
                if text:
                    # Extract page number from text like "1/3", "1", "page 1"
                    match = re.search(r"\d+", text)
                    if match:
                        return int(match.group())

        except Exception:
            pass

        return 1
