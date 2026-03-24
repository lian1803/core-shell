// Analysis Types
/**
 * Type definitions for analysis functionality
 * Following TypeScript naming conventions (PascalCase)
 */

export enum AnalysisStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
}

// ===== Request Types =====

export interface AnalysisRequest {
  business_name: string;
  region?: string;
}

// ===== Response Types =====

export interface PlaceBasicInfo {
  id: string;
  request_id: string;
  place_id: string;
  place_url: string;
  business_name: string;
  address: string;
  phone: string;
  created_at: string;
}

export interface PhotoInfo {
  id: string;
  request_id: string;
  photo_count: number;
  has_5_photos: boolean;
  has_video: boolean;
  has_gif: boolean;
  created_at: string;
}

export interface ReviewInfo {
  id: string;
  request_id: string;
  review_count: number;
  has_owner_reply: boolean;
  recent_replies: number;
  created_at: string;
}

export interface ChannelInfo {
  id: string;
  request_id: string;
  blog_count: number;
  has_instagram: boolean;
  has_kakao_channel: boolean;
  created_at: string;
}

export interface GenderRatio {
  male: number;
  female: number;
}

export interface KeywordStats {
  id: string;
  request_id: string;
  keyword: string;
  monthly_search_pc: number;
  monthly_search_mobile: number;
  gender_ratio: GenderRatio;
  day_of_week: number[];
  age_group: AgeGroup;
  created_at: string;
}

export interface AgeGroup {
  range_20s: number;
  range_30s: number;
  range_40s: number;
  range_50s: number;
}

export interface CurrentRank {
  id: string;
  request_id: string;
  keyword: string;
  rank: number;
  page: number;
  created_at: string;
}

export interface ExpandedKeyword {
  id: string;
  request_id: string;
  keyword: string;
  search_volume: number;
  relevance_score: number;
  created_at: string;
}

export interface Proposal {
  id: string;
  request_id: string;
  file_path: string;
  file_url: string;
  created_at: string;
}

export interface DiagnosisComment {
  category: string;
  message: string;
}

export interface AnalysisResponse {
  id: string;
  business_name: string;
  region?: string;
  status: AnalysisStatus;
  created_at: string;
  updated_at: string;

  // Optional when completed
  place_info?: PlaceBasicInfo;
  photo_info?: PhotoInfo;
  review_info?: ReviewInfo;
  channel_info?: ChannelInfo;
  keyword_stats?: KeywordStats;
  current_rank?: CurrentRank;
  expanded_keywords?: ExpandedKeyword[];
  proposal?: Proposal;
  diagnosis_comments?: DiagnosisComment[];
}

// ===== Error Types =====

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}
