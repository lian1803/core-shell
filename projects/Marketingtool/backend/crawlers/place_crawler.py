# Place Crawler
"""
Naver Place crawler implementation
Following Python naming conventions (snake_case)
"""

from typing import Optional, Dict, Any
import time
import re

from crawlers.base import BaseCrawler
from selenium.webdriver.common.by import By


class PlaceCrawler(BaseCrawler):
    """
    Crawler for Naver Place basic information
    Uses robust selectors (text, attributes) instead of relying on CSS classes
    """

    def crawl(self, url: str) -> Dict[str, Any]:
        """
        Crawl Naver Place page and extract basic information

        Args:
            url: Naver Place URL

        Returns:
            Dict containing place information
        """
        if not self.navigate_safely(url):
            return {"error": "Failed to navigate to page"}

        # Wait for page to load
        time.sleep(2)

        result = {
            "place_id": self._extract_place_id(url),
            "place_url": url,
            "business_name": "",
            "address": "",
            "phone": "",
        }

        # Extract business name - try multiple selectors
        name_element = (
            self.find_element_by_attribute("h1", "class", "head") or
            self.find_element_by_text("상호명", partial=True) or
            self.find_element_safely(By.CSS_SELECTOR, "h1")
        )
        if name_element:
            result["business_name"] = self.get_text_safely(name_element) or ""

        # Extract address - try multiple approaches
        address_element = (
            self.find_element_by_attribute("span", "data-testid", "address") or
            self.find_element_by_text("주소", partial=True) or
            self.find_element_safely(By.CSS_SELECTOR, "address") or
            self.find_element_safely(By.CSS_SELECTOR, "[class*='address']")
        )
        if address_element:
            result["address"] = self.get_text_safely(address_element) or ""

        # Extract phone - try multiple approaches
        phone_element = (
            self.find_element_by_attribute("a", "data-testid", "phone") or
            self.find_element_by_text("전화번호", partial=True) or
            self.find_element_safely(By.CSS_SELECTOR, "a[href*='tel:']") or
            self.find_element_by_attribute("a", "href", "tel:")
        )
        if phone_element:
            href = self.get_attribute_safely(phone_element, "href") or ""
            # Extract phone number from href
            phone_match = re.search(r"tel:([0-9\-]+)", href)
            if phone_match:
                result["phone"] = phone_match.group(1)

        return result

    def _extract_place_id(self, url: str) -> str:
        """
        Extract place ID from URL
        URL format: https://place.naver.com/restaurant/12345678
        """
        try:
            # Extract ID from URL (last part after /)
            parts = url.rstrip("/").split("/")
            return parts[-1] if parts else ""
        except Exception:
            return ""

    def search_place_id(self, business_name: str, region: Optional[str] = None) -> Optional[str]:
        """
        Search Naver to get place ID

        Args:
            business_name: Business name to search
            region: Optional region name for better search result

        Returns:
            Place ID if found, None otherwise
        """
        search_url = f"https://search.naver.com/search.naver?query={business_name}"
        if region:
            search_url += f" {region}"

        if not self.navigate_safely(search_url):
            return None

        # Wait for search results
        time.sleep(2)

        # Find first place result link - try multiple approaches
        place_link = (
            self.find_element_by_attribute("a", "data-gcl-click-target", "place") or
            self.find_element_by_text("플레이스", partial=True) or
            self.find_element_safely(By.CSS_SELECTOR, "a[href*='place.naver.com']")
        )

        if place_link:
            place_url = self.get_attribute_safely(place_link, "href") or ""
            return self._extract_place_id(place_url)

        return None

    def capture_place_screenshot(self, business_name: str) -> Optional[str]:
        """
        Capture screenshot of the place page

        Args:
            business_name: Business name for filename

        Returns:
            Screenshot file path if successful, None otherwise
        """
        filename = f"place_{business_name.replace(' ', '_')}"
        return self.capture_screenshot(filename)
