# Photo Crawler
"""
Naver Place photo information crawler
"""

from typing import Dict, Any
import time
import re

from crawlers.base import BaseCrawler
from selenium.webdriver.common.by import By


class PhotoCrawler(BaseCrawler):
    """
    Crawler for photo information
    Uses robust selectors for better stability
    """

    def crawl(self, url: str) -> Dict[str, Any]:
        """
        Crawl photo information from place page

        Args:
            url: Naver Place URL

        Returns:
            Dict containing photo information
        """
        if not self.navigate_safely(url):
            return {"error": "Failed to navigate to page"}

        # Wait for page to load
        time.sleep(2)

        photo_count = self._extract_photo_count()
        return {
            "photo_count": photo_count,
            "has_5_photos": photo_count >= 5,
            "has_video": self._check_has_video(),
            "has_gif": self._check_has_gif(),
        }

    def _extract_photo_count(self) -> int:
        """Extract total photo count"""
        try:
            # Try multiple approaches for robustness

            # Method 1: Look for text containing photo count
            count_text_element = (
                self.find_element_by_text("사진", partial=True) or
                self.find_element_by_text("장", partial=True) or
                self.find_element_safely(By.CSS_SELECTOR, "[class*='photo']")
            )

            if count_text_element:
                text = self.get_text_safely(count_text_element)
                if text:
                    # Extract number from text like "사진 5장", "12장", etc.
                    match = re.search(r"\d+", text)
                    if match:
                        return int(match.group())

            # Method 2: Count actual image elements
            images = (
                self.find_elements_safely(By.CSS_SELECTOR, "img[class*='photo']") or
                self.find_elements_safely(By.CSS_SELECTOR, "img[alt*='대표']") or
                self.find_elements_safely(By.CSS_SELECTOR, ".photo img") or
                self.find_elements_safely(By.CSS_SELECTOR, "div[class*='image'] img")
            )

            if images and len(images) > 0:
                return len(images)

            # Method 3: Look for data attribute
            count_attr_element = self.find_element_by_attribute("div", "data-count", "")
            if count_attr_element:
                count = self.get_attribute_safely(count_attr_element, "data-count")
                if count:
                    try:
                        return int(count)
                    except ValueError:
                        pass

        except Exception as e:
            print(f"Error extracting photo count: {e}")

        return 0

    def _check_has_video(self) -> bool:
        """Check if there are any videos"""
        try:
            # Try multiple approaches
            videos = (
                self.find_elements_safely(By.CSS_SELECTOR, "video") or
                self.find_elements_safely(By.CSS_SELECTOR, "[class*='video']") or
                self.find_elements_safely(By.CSS_SELECTOR, "iframe[src*='video']")
            )
            return len(videos) > 0
        except Exception:
            return False

    def _check_has_gif(self) -> bool:
        """Check if there are any GIF images"""
        try:
            # Find all images and check for GIF extension
            images = (
                self.find_elements_safely(By.CSS_SELECTOR, "img") or
                self.find_elements_safely(By.TAG_NAME, "img")
            )

            for img in images:
                src = self.get_attribute_safely(img, "src") or ""
                if ".gif" in src.lower():
                    return True

                # Also check data-src attribute
                data_src = self.get_attribute_safely(img, "data-src") or ""
                if ".gif" in data_src.lower():
                    return True

        except Exception:
            pass

        return False
