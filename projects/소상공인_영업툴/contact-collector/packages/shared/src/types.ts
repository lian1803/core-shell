// Shared types for contact-collector

export type Platform = 'GOOGLE' | 'NAVER' | 'DAANGN' | 'INSTAGRAM';

export type JobStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface CreateJobInput {
  name?: string;
  keyword: string;
  region?: string;
  limitCount?: number;
  platforms: Platform[];
}

export interface Job {
  id: string;
  name: string;
  keyword: string;
  region: string | null;
  limitCount: number;
  platforms: Platform[];
  status: JobStatus;
  totalRaw: number;
  filteredCount: number;
  validCount: number;
  errorMessage: string | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  userId: string;
}

export interface Contact {
  id: string;
  bizName: string;
  category: string | null;
  phone: string | null;
  kakao: string | null;
  email: string | null;
  sources: Platform[];
  rawSources: string[];
  collectedAt: string;
}

export interface PlatformStat {
  platform: Platform;
  status: 'SUCCESS' | 'RUNNING' | 'FAILED';
  collected: number;
  error?: string;
}

export interface JobDetail extends Job {
  platformStats: PlatformStat[];
}

// BullMQ job data
export interface ScraperJobData {
  jobId: string;
  keyword: string;
  region?: string;
  limitCount: number;
  platforms: Platform[];
}

// Scraper result
export interface ScraperResult {
  bizName: string;
  category?: string;
  phone?: string;
  kakao?: string;
  email?: string;
  source: Platform;
  rawSource: string;
}
