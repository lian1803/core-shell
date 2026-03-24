# Analysis Service
"""
Business logic for analysis operations
"""

import os
from typing import Optional, List, Dict, Any
import uuid
from datetime import datetime

from models.schemas import (
    AnalysisRequest,
    AnalysisStatus,
    PlaceBasicInfo,
    PhotoInfo,
    ReviewInfo,
    ChannelInfo,
    KeywordStats,
    GenderRatio,
    AgeGroup,
    CurrentRank,
    ExpandedKeyword,
    DiagnosisComment,
)

from crawlers.place_crawler import PlaceCrawler
from crawlers.photo_crawler import PhotoCrawler
from crawlers.review_crawler import ReviewCrawler
from crawlers.blog_crawler import BlogCrawler
from crawlers.rank_crawler import RankCrawler
from clients.naver_client import NaverClient
from clients.keyword_client import KeywordToolClient


class AnalysisService:
    """
    Main analysis service that orchestrates all crawlers and services
    """

    def __init__(self, driver):
        self.driver = driver
        self.naver_client = NaverClient()
        self.keyword_client = KeywordToolClient()

        # Initialize crawlers
        self.place_crawler = PlaceCrawler(driver)
        self.photo_crawler = PhotoCrawler(driver)
        self.review_crawler = ReviewCrawler(driver)
        self.blog_crawler = BlogCrawler(driver)
        self.rank_crawler = RankCrawler(driver)

    def analyze(self, request: AnalysisRequest) -> Dict[str, Any]:
        """
        Perform full analysis for a business

        Args:
            request: AnalysisRequest with business_name and optional region

        Returns:
            Dict containing all analysis results
        """
        request_id = str(uuid.uuid4())
        business_name = request.business_name
        region = request.region

        print(f"Starting analysis for: {business_name} (region: {region})")

        # Step 1: Get place ID from search
        print("Step 1: Searching for place ID...")
        place_id = self.place_crawler.search_place_id(business_name, region)

        if not place_id:
            return {
                "error": "Place not found",
                "message": f"Cannot find place: {business_name}",
            }

        place_url = f"https://place.naver.com/restaurant/{place_id}"

        # Step 2: Crawl place information
        print("Step 2: Crawling place information...")
        place_data = self.place_crawler.crawl(place_url)

        # Step 3: Crawl photo information
        print("Step 3: Crawling photo information...")
        photo_data = self.photo_crawler.crawl(place_url)

        # Step 4: Crawl review information
        print("Step 4: Crawling review information...")
        review_data = self.review_crawler.crawl(place_url)

        # Step 5: Crawl blog/external channel information
        print("Step 5: Crawling channel information...")
        channel_data = self.blog_crawler.crawl(place_url)

        # Step 6: Get keyword statistics from Naver Data Lab
        print("Step 6: Fetching keyword statistics...")
        keyword_stats = self._get_keyword_stats(business_name)

        # Step 7: Get current rank (with screenshot)
        print("Step 7: Checking current rank...")
        rank_data = self.rank_crawler.crawl(business_name)

        # Extract screenshot path from rank data
        rank_screenshot = rank_data.pop("screenshot", None)

        # Step 8: Get expanded keywords
        print("Step 8: Getting expanded keywords...")
        expanded_keywords = self.keyword_client.get_expanded_keywords(business_name, limit=20)

        # Step 9: Generate diagnosis comments
        print("Step 9: Generating diagnosis comments...")
        diagnosis_comments = self._generate_diagnosis_comments(
            photo_data, review_data, channel_data
        )

        print("Analysis completed!")

        return {
            "id": request_id,
            "business_name": business_name,
            "region": region,
            "status": AnalysisStatus.COMPLETED,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "place_info": place_data,
            "photo_info": photo_data,
            "review_info": review_data,
            "channel_info": channel_data,
            "keyword_stats": keyword_stats,
            "current_rank": rank_data,
            "current_rank_screenshot": rank_screenshot,  # Add screenshot path
            "expanded_keywords": expanded_keywords,
            "diagnosis_comments": diagnosis_comments,
        }

    def _get_keyword_stats(self, keyword: str) -> Dict[str, Any]:
        """
        Get keyword statistics from Naver Data Lab

        Uses Client ID and Client Secret for authentication
        """
        # Get search volume
        search_volume = self.naver_client.get_keyword_stats(keyword)
        if not search_volume:
            search_volume = {"monthly_search_pc": 0, "monthly_search_mobile": 0}

        # Get gender ratio
        gender_ratio = self.naver_client.get_gender_ratio(keyword)
        if not gender_ratio:
            gender_ratio = {"male": 50, "female": 50}

        # Get age group
        age_group = self.naver_client.get_age_group(keyword)
        if not age_group:
            age_group = {"20s": 0, "30s": 0, "40s": 0, "50s": 0}

        # Get day of week
        day_of_week = self.naver_client.get_day_of_week(keyword)
        if not day_of_week:
            day_of_week = [14, 14, 15, 15, 22, 12, 12]  # Default values

        return {
            "keyword": keyword,
            **search_volume,
            "gender_ratio": GenderRatio(**gender_ratio),
            "age_group": AgeGroup(**age_group),
            "day_of_week": day_of_week,
        }

    def _generate_diagnosis_comments(
        self,
        photo_data: Dict[str, Any],
        review_data: Dict[str, Any],
        channel_data: Dict[str, Any],
    ) -> List[Dict[str, Any]]:
        """
        Generate auto-generated diagnosis comments based on data
        """
        comments = []

        # Photo-related comments
        if photo_data.get("photo_count", 0) < 5:
            comments.append({
                "category": "photo",
                "message": f"대표 사진 5장 설정이 가능한데 현재 {photo_data['photo_count']}장만 등록되어 있습니다. 뚜렷한 이미지로 재설정이 필요합니다."
            })

        if photo_data.get("has_video"):
            comments.append({
                "category": "photo",
                "message": "영상이 포함되어 있어 매력적인 소개가 가능합니다."
            })

        # Review-related comments
        if not review_data.get("has_owner_reply", False):
            comments.append({
                "category": "review",
                "message": "영수증 리뷰에 답글 작성이 안 되어 있습니다. 리뷰 답글 관리가 필요합니다."
            })

        if review_data.get("review_count", 0) < 10:
            comments.append({
                "category": "review",
                "message": f"리뷰가 {review_data['review_count']}건으로 적습니다. 리뷰 수를 늘리는 것이 좋습니다."
            })

        # Channel-related comments
        if channel_data.get("blog_count", 0) == 0:
            comments.append({
                "category": "channel",
                "message": "블로그 노출이 없습니다. 블로그 마케팅을 고려해보세요."
            })

        if not channel_data.get("has_kakao_channel"):
            comments.append({
                "category": "channel",
                "message": "카카오톡 채널 연동이 되어 있지 않습니다. 채널 연동을 고려해보세요."
            })

        return comments
