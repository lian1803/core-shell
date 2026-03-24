# Keyword Tool Client
"""
Client for keyword tool API (for expanded keywords)
"""

import os
from typing import List, Optional, Dict, Any
import requests


class KeywordToolClient:
    """
    Client for keyword tool API
    Can be configured to use different providers
    """

    def __init__(self):
        self.api_key = os.getenv("KEYWORD_TOOL_API_KEY", "")
        self.base_url = "https://api.example.com"  # Replace with actual API

    def get_headers(self) -> Dict[str, str]:
        """Get headers with API key"""
        headers = {
            "Content-Type": "application/json",
        }
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        return headers

    def get_expanded_keywords(self, keyword: str, limit: int = 20) -> List[Dict[str, Any]]:
        """
        Get expanded/related keywords

        Args:
            keyword: Main keyword to expand
            limit: Maximum number of keywords to return

        Returns:
            List of expanded keywords with search volume
        """
        if not self.api_key:
            print("Keyword tool API key not configured")
            return []

        # Use Naver auto-complete as fallback if no API key
        return self._get_naver_autocomplete_keywords(keyword, limit)

    def _get_naver_autocomplete_keywords(self, keyword: str, limit: int) -> List[Dict[str, Any]]:
        """
        Get auto-complete keywords from Naver search (fallback)
        This doesn't require API key
        """
        try:
            search_url = f"https://ac.search.naver.com/ac?q={keyword}&st=1&r_format=json&r_enc=UTF-8&r_lt=10001"
            response = requests.get(search_url, timeout=10)

            if response.status_code == 200:
                data = response.json()
                items = data.get("items", [])

                expanded_keywords = []
                for item in items[:limit]:
                    expanded_keywords.append({
                        "keyword": item[0],  # Suggested keyword
                        "search_volume": 0,  # Volume not available without API
                        "relevance_score": 1.0 - (len(expanded_keywords) * 0.05),  # Decrease relevance
                    })

                return expanded_keywords

        except Exception as e:
            print(f"Error fetching auto-complete keywords: {e}")

        # Fallback: generate some related keywords
        return self._generate_related_keywords(keyword, limit)

    def _generate_related_keywords(self, keyword: str, limit: int) -> List[Dict[str, Any]]:
        """
        Generate related keywords when API is not available
        """
        # Common suffixes/prefixes for Korean businesses
        suffixes = ["가격", "리뷰", "주소", "전화번호", "예약", "오픈", "영업시간"]
        prefixes = ["좋은", "추천", "근처", "인기", "방문"]

        related = []
        for i, suffix in enumerate(suffixes):
            if i >= limit:
                break
            related.append({
                "keyword": f"{keyword} {suffix}",
                "search_volume": 0,
                "relevance_score": 1.0 - (i * 0.05),
            })

        return related
