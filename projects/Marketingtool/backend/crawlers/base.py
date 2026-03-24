# Base Crawler
"""
Abstract base class for all crawlers
Following Python naming conventions (snake_case)
"""

from abc import ABC, abstractmethod
from typing import Optional, Dict, Any, List
import time
import os
from datetime import datetime

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import NoSuchElementException, TimeoutException


class BaseCrawler(ABC):
    """
    Base crawler class
    All crawlers should inherit from this class
    """

    def __init__(
        self,
        driver: webdriver.Chrome,
        max_retries: int = 3,
        screenshot_dir: str = "./screenshots"
    ):
        """
        Initialize base crawler

        Args:
            driver: Selenium WebDriver instance
            max_retries: Maximum retry attempts for failed operations
            screenshot_dir: Directory to save screenshots
        """
        self.driver = driver
        self.max_retries = max_retries
        self.default_timeout = 10  # seconds
        self.screenshot_dir = screenshot_dir

        # Create screenshot directory if not exists
        os.makedirs(screenshot_dir, exist_ok=True)

    @abstractmethod
    def crawl(self, url: str) -> Dict[str, Any]:
        """
        Crawl given URL and return data

        Args:
            url: Target URL to crawl

        Returns:
            Dict containing crawled data
        """
        pass

    def find_element_safely(self, by: By, value: str, timeout: Optional[int] = None) -> Optional[Any]:
        """
        Find element safely with timeout

        Args:
            by: By locator strategy
            value: Locator value
            timeout: Custom timeout (uses default if None)

        Returns:
            Element if found, None otherwise
        """
        try:
            timeout = timeout or self.default_timeout
            element = WebDriverWait(self.driver, timeout).until(
                EC.presence_of_element_located((by, value))
            )
            return element
        except (TimeoutException, Exception):
            return None

    def find_elements_safely(self, by: By, value: str, timeout: Optional[int] = None) -> List:
        """
        Find elements safely with timeout

        Args:
            by: By locator strategy
            value: Locator value
            timeout: Custom timeout (uses default if None)

        Returns:
            List of elements found (empty list if none)
        """
        try:
            timeout = timeout or self.default_timeout
            elements = WebDriverWait(self.driver, timeout).until(
                EC.presence_of_all_elements_located((by, value))
            )
            return elements
        except (TimeoutException, Exception):
            return []

    def find_element_by_text(
        self, text: str, partial: bool = False, timeout: Optional[int] = None
    ) -> Optional[Any]:
        """
        Find element by text content (more robust than CSS class names)

        Args:
            text: Text content to search for
            partial: Whether to match partial text (contains vs equals)
            timeout: Custom timeout

        Returns:
            Element if found, None otherwise
        """
        try:
            timeout = timeout or self.default_timeout
            if partial:
                # Use XPath with contains for partial match
                element = WebDriverWait(self.driver, timeout).until(
                    lambda d: d.find_element(
                        By.XPATH,
                        f"//*[contains(text(), '{text}')]"
                    )
                )
            else:
                # Exact text match
                element = WebDriverWait(self.driver, timeout).until(
                    lambda d: d.find_element(
                        By.XPATH,
                        f"//*[text()='{text}']"
                    )
                )
            return element
        except (NoSuchElementException, TimeoutException):
            return None

    def find_element_by_attribute(
        self, tag: str, attr: str, value: str, timeout: Optional[int] = None
    ) -> Optional[Any]:
        """
        Find element by attribute (more robust for dynamic class names)

        Args:
            tag: HTML tag name
            attr: Attribute name
            value: Attribute value
            timeout: Custom timeout

        Returns:
            Element if found, None otherwise
        """
        try:
            timeout = timeout or self.default_timeout
            element = WebDriverWait(self.driver, timeout).until(
                lambda d: d.find_element(
                    By.XPATH,
                    f"//{tag}[contains(@{attr}, '{value}')]"
                )
            )
            return element
        except (NoSuchElementException, TimeoutException):
            return None

    def find_elements_by_attribute(
        self, tag: str, attr: str, value: str, timeout: Optional[int] = None
    ) -> List:
        """
        Find multiple elements by attribute

        Args:
            tag: HTML tag name
            attr: Attribute name
            value: Attribute value
            timeout: Custom timeout

        Returns:
            List of elements found
        """
        try:
            timeout = timeout or self.default_timeout
            elements = WebDriverWait(self.driver, timeout).until(
                lambda d: d.find_elements(
                    By.XPATH,
                    f"//{tag}[contains(@{attr}, '{value}')]"
                )
            )
            return elements
        except (NoSuchElementException, TimeoutException):
            return []

    def get_text_safely(self, element) -> Optional[str]:
        """
        Get text content safely from element

        Args:
            element: WebElement to extract text from

        Returns:
            Text content or None
        """
        try:
            return element.text.strip() if element else None
        except Exception:
            return None

    def get_attribute_safely(self, element, attr: str) -> Optional[str]:
        """
        Get attribute value safely from element

        Args:
            element: WebElement to extract attribute from
            attr: Attribute name

        Returns:
            Attribute value or None
        """
        try:
            return element.get_attribute(attr)
        except Exception:
            return None

    def capture_screenshot(
        self, filename: str, element: Optional[Any] = None
    ) -> Optional[str]:
        """
        Capture screenshot and save to file

        Args:
            filename: Screenshot filename (without extension)
            element: Optional WebElement to screenshot (full page if None)

        Returns:
            Full path to screenshot file if successful, None otherwise
        """
        try:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            safe_filename = f"{filename}_{timestamp}.png"
            filepath = os.path.join(self.screenshot_dir, safe_filename)

            if element:
                # Screenshot specific element
                element.screenshot(filepath)
            else:
                # Full page screenshot
                self.driver.save_screenshot(filepath)

            print(f"Screenshot saved: {filepath}")
            return filepath
        except Exception as e:
            print(f"Failed to capture screenshot: {e}")
            return None

    def scroll_to_element(self, element) -> None:
        """
        Scroll to make element visible

        Args:
            element: WebElement to scroll to
        """
        try:
            self.driver.execute_script(
                "arguments[0].scrollIntoView({behavior: 'smooth', block: 'center'});",
                element
            )
            time.sleep(0.5)  # Wait for scroll to complete
        except Exception:
            pass

    def wait_for_element_visible(self, by: By, value: str, timeout: Optional[int] = None) -> Optional[Any]:
        """
        Wait for element to be visible (not just present)

        Args:
            by: By locator strategy
            value: Locator value
            timeout: Custom timeout

        Returns:
            Element if visible, None otherwise
        """
        try:
            timeout = timeout or self.default_timeout
            element = WebDriverWait(self.driver, timeout).until(
                EC.visibility_of_element_located((by, value))
            )
            return element
        except (TimeoutException, Exception):
            return None

    def retry_operation(self, operation, max_attempts: Optional[int] = None) -> Optional[Any]:
        """
        Retry an operation with delay

        Args:
            operation: Function to retry
            max_attempts: Maximum retry attempts

        Returns:
            Result of operation or None if all retries failed
        """
        attempts = max_attempts or self.max_retries
        last_error = None

        for attempt in range(attempts):
            try:
                return operation()
            except Exception as e:
                last_error = e
                if attempt < attempts - 1:
                    # Exponential backoff: 1s, 2s, 4s...
                    delay = min(2 ** attempt, 5)
                    time.sleep(delay)
                else:
                    break

        print(f"Operation failed after {attempts} attempts: {last_error}")
        return None

    def navigate_safely(self, url: str, wait_for_load: bool = True) -> bool:
        """
        Navigate to URL safely

        Args:
            url: Target URL
            wait_for_load: Whether to wait for page load

        Returns:
            True if successful, False otherwise
        """
        try:
            self.driver.get(url)
            if wait_for_load:
                # Wait for page to load
                WebDriverWait(self.driver, 15).until(
                    lambda d: d.execute_script("return document.readyState") == "complete"
                )
            return True
        except Exception as e:
            print(f"Failed to navigate to {url}: {e}")
            return False
