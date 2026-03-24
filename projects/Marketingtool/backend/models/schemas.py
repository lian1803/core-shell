# Pydantic Schemas
"""
Data models for API requests and responses
Following Dynamic level conventions
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum


class AnalysisStatus(str, Enum):
    """Analysis status enum"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


# ===== Request Schemas =====

class AnalysisRequest(BaseModel):
    """Analysis request from client"""
    business_name: str = Field(..., min_length=1, max_length=100)
    region: Optional[str] = Field(None, max_length=50)


class DiagnosisComment(BaseModel):
    """Auto-generated diagnosis comment"""
    category: str  # "photo", "review", "keyword", etc.
    message: str


# ===== Response Schemas =====

class PlaceBasicInfo(BaseModel):
    """Naver Place basic information"""
    id: str
    request_id: str
    place_id: str
    place_url: str
    business_name: str
    address: str
    phone: str
    created_at: datetime


class PhotoInfo(BaseModel):
    """Photo information"""
    id: str
    request_id: str
    photo_count: int
    has_5_photos: bool
    has_video: bool
    has_gif: bool
    created_at: datetime


class ReviewInfo(BaseModel):
    """Review information"""
    id: str
    request_id: str
    review_count: int
    has_owner_reply: bool
    recent_replies: int
    created_at: datetime


class ChannelInfo(BaseModel):
    """Channel information"""
    id: str
    request_id: str
    blog_count: int
    has_instagram: bool
    has_kakao_channel: bool
    created_at: datetime


class GenderRatio(BaseModel):
    """Gender ratio from Naver Data Lab"""
    male: int
    female: int


class DayOfWeek(BaseModel):
    """Day of week search ratio"""
    day: int  # 0=Monday, 6=Sunday
    ratio: int


class AgeGroup(BaseModel):
    """Age group search ratio"""
    range_20s: int = Field(..., alias="20s")
    range_30s: int = Field(..., alias="30s")
    range_40s: int = Field(..., alias="40s")
    range_50s: int = Field(..., alias="50s")


class KeywordStats(BaseModel):
    """Keyword statistics from Naver Data Lab"""
    id: str
    request_id: str
    keyword: str
    monthly_search_pc: int
    monthly_search_mobile: int
    gender_ratio: GenderRatio
    day_of_week: List[int]  # 7 values for Monday-Sunday
    age_group: AgeGroup
    created_at: datetime


class CurrentRank(BaseModel):
    """Current rank in mobile search"""
    id: str
    request_id: str
    keyword: str
    rank: int
    page: int
    created_at: datetime


class ExpandedKeyword(BaseModel):
    """Expanded keyword list"""
    id: str
    request_id: str
    keyword: str
    search_volume: int
    relevance_score: float
    created_at: datetime


class Proposal(BaseModel):
    """Generated proposal (PPT)"""
    id: str
    request_id: str
    file_path: str
    file_url: str
    created_at: datetime


class AnalysisResponse(BaseModel):
    """Complete analysis response"""
    id: str
    business_name: str
    region: Optional[str]
    status: AnalysisStatus
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    # Optional: included when status is completed
    place_info: Optional[PlaceBasicInfo] = None
    photo_info: Optional[PhotoInfo] = None
    review_info: Optional[ReviewInfo] = None
    channel_info: Optional[ChannelInfo] = None
    keyword_stats: Optional[KeywordStats] = None
    current_rank: Optional[CurrentRank] = None
    expanded_keywords: Optional[List[ExpandedKeyword]] = None
    proposal: Optional[Proposal] = None
    diagnosis_comments: Optional[List[DiagnosisComment]] = None


# ===== Error Schemas =====

class ErrorResponse(BaseModel):
    """Standard error response"""
    error: Dict[str, Any] = Field(
        ...,
        example={
            "code": "CRAWLING_FAILED",
            "message": "Failed to crawl place information",
            "details": {}
        }
    )


class ValidationError(BaseModel):
    """Validation error details"""
    field: str
    message: str
