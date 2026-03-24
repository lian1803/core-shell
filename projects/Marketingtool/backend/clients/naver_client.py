# Naver API Client
"""
Naver API client for search volume and data lab
"""

import os
from typing import Dict, Any, List, Optional
import requests


class NaverClient:
    """
    Client for Naver Data Lab API
    """

    def __init__(self):
        self.client_id = os.getenv("NAVER_CLIENT_ID", "")
        self.client_secret = os.getenv("NAVER_CLIENT_SECRET", "")
        self.data_lab_key = os.getenv("NAVER_DATA_LAB_KEY", "")
        self.base_url = "https://openapi.naver.com"

    def get_headers(self) -> Dict[str, str]:
        """Get headers with Naver authentication"""
        return {
            "X-Naver-Client-Id": self.client_id,
            "X-Naver-Client-Secret": self.client_secret,
            "Content-Type": "application/json",
        }

    def get_keyword_stats(self, keyword: str) -> Optional[Dict[str, Any]]:
        """
        Get keyword search volume from Naver Data Lab

        Uses Client ID and Client Secret for authentication
        """
        url = f"{self.base_url}/datalab/v1/search/keyword/insight"
        headers = self.get_headers()

        try:
            # Request for search volume
            response = requests.post(
                f"{url}/daily",
                json={"keyword": keyword},
                headers=headers,
                timeout=10
            )

            if response.status_code == 200:
                data = response.json()

                # Extract monthly search volume (PC + Mobile)
                monthly_search_pc = 0
                monthly_search_mobile = 0
                for item in data.get("results", []):
                    for period in item.get("data", []):
                        ratio = period.get("ratio", {})
                        monthly_search_pc += ratio.get("pc", 0)
                        monthly_search_mobile += ratio.get("mobile", 0)

                return {
                    "monthly_search_pc": monthly_search_pc,
                    "monthly_search_mobile": monthly_search_mobile,
                }

        except Exception as e:
            print(f"Error fetching keyword stats: {e}")

        return None

    def get_gender_ratio(self, keyword: str) -> Optional[Dict[str, int]]:
        """
        Get gender ratio for keyword search using Naver Data Lab API

        Uses Client ID and Client Secret for authentication
        """
        url = f"{self.base_url}/datalab/v1/search/keyword/insight/gender"
        headers = self.get_headers()

        try:
            response = requests.post(
                url,
                json={"keyword": keyword},
                headers=headers,
                timeout=10
            )

            if response.status_code == 200:
                data = response.json()
                ratio = data.get("results", [{}])[0].get("data", [{}])[0].get("ratio", {})

                return {
                    "male": ratio.get("m", 50),
                    "female": ratio.get("f", 50),
                }

        except Exception as e:
            print(f"Error fetching gender ratio: {e}")

        return None

    def get_age_group(self, keyword: str) -> Optional[Dict[str, int]]:
        """
        Get age group distribution for keyword search using Naver Data Lab API

        Uses Client ID and Client Secret for authentication
        """
        url = f"{self.base_url}/datalab/v1/search/keyword/insight/age"
        headers = self.get_headers()

        try:
            response = requests.post(
                url,
                json={"keyword": keyword},
                headers=headers,
                timeout=10
            )

            if response.status_code == 200:
                data = response.json()
                ratio = data.get("results", [{}])[0].get("data", [{}])[0].get("ratio", {})

                return {
                    "range_20s": ratio.get("1", 0),
                    "range_30s": ratio.get("2", 0),
                    "range_40s": ratio.get("3", 0),
                    "range_50s": ratio.get("4", 0),
                }

        except Exception as e:
            print(f"Error fetching age group: {e}")

        return None

    def get_day_of_week(self, keyword: str) -> Optional[List[int]]:
        """
        Get day of week search distribution using Naver Data Lab API

        Uses Client ID and Client Secret for authentication
        """
        url = f"{self.base_url}/datalab/v1/search/keyword/insight/day"
        headers = self.get_headers()

        try:
            response = requests.post(
                url,
                json={"keyword": keyword},
                headers=headers,
                timeout=10
            )

            if response.status_code == 200:
                data = response.json()
                ratios = data.get("results", [{}])[0].get("data", [{}])[0].get("ratio", {})

                # Convert to list of 7 values (Monday-Sunday)
                day_values = [0] * 7
                for day_data in ratios:
                    day_num = int(day_data.get("day", "0"))  # 0=Monday
                    if 0 <= day_num <= 6:
                        day_values[day_num] = day_data.get("ratio", 0)

                return day_values

        except Exception as e:
            print(f"Error fetching day of week: {e}")

        return None
