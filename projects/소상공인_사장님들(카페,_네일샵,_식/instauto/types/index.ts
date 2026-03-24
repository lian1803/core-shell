// types/index.ts
// 공통 타입 정의 및 Zod 스키마

import { z } from 'zod';

// =============================================================================
// API 응답 타입
// =============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// =============================================================================
// 에러 코드
// =============================================================================

export const ErrorCodes = {
  // 인증 관련
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',

  // 검증 관련
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',

  // 리소스 관련
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',

  // 비즈니스 로직
  TRIAL_EXPIRED: 'TRIAL_EXPIRED',
  SUBSCRIPTION_REQUIRED: 'SUBSCRIPTION_REQUIRED',
  REGENERATE_LIMIT_EXCEEDED: 'REGENERATE_LIMIT_EXCEEDED',
  TRIAL_ALREADY_EXTENDED: 'TRIAL_ALREADY_EXTENDED',
  INVALID_REVIEW_URL: 'INVALID_REVIEW_URL',

  // 외부 서비스
  OPENAI_ERROR: 'OPENAI_ERROR',
  STORAGE_ERROR: 'STORAGE_ERROR',
  PAYMENT_ERROR: 'PAYMENT_ERROR',
  EMAIL_ERROR: 'EMAIL_ERROR',

  // 서버 에러
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',

  // Cron 관련
  CRON_UNAUTHORIZED: 'CRON_UNAUTHORIZED',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

// =============================================================================
// Zod 스키마 - 온보딩
// =============================================================================

export const onboardingSchema = z.object({
  shopName: z
    .string()
    .min(1, '가게 이름을 입력해주세요')
    .max(50, '가게 이름은 50자 이내로 입력해주세요'),
  industry: z
    .string()
    .default('cafe'),
  vibeKeywords: z
    .array(z.string().min(1).max(20))
    .min(1, '분위기 키워드를 최소 1개 선택해주세요')
    .max(3, '분위기 키워드는 최대 3개까지 선택 가능합니다'),
  representMenus: z
    .array(z.string().min(1).max(30))
    .min(1, '대표 메뉴를 최소 1개 입력해주세요')
    .max(3, '대표 메뉴는 최대 3개까지 입력 가능합니다'),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;

// =============================================================================
// Zod 스키마 - 콘텐츠
// =============================================================================

export const regenerateSchema = z.object({
  contentId: z.string().uuid('유효하지 않은 콘텐츠 ID입니다'),
  type: z.enum(['image', 'caption'], {
    errorMap: () => ({ message: 'type은 image 또는 caption이어야 합니다' }),
  }),
});

export type RegenerateInput = z.infer<typeof regenerateSchema>;

export const editCaptionSchema = z.object({
  editedCaption: z
    .string()
    .min(1, '캡션을 입력해주세요')
    .max(2200, '캡션은 2200자 이내로 입력해주세요'), // Instagram 캡션 제한
});

export type EditCaptionInput = z.infer<typeof editCaptionSchema>;

// =============================================================================
// Zod 스키마 - 결제
// =============================================================================

export const paymentConfirmSchema = z.object({
  paymentKey: z.string().min(1, '결제 키가 필요합니다'),
  orderId: z.string().min(1, '주문 ID가 필요합니다'),
  amount: z.number().positive('결제 금액은 양수여야 합니다'),
});

export type PaymentConfirmInput = z.infer<typeof paymentConfirmSchema>;

export const billingKeySchema = z.object({
  authKey: z.string().min(1, '인증 키가 필요합니다'),
  customerKey: z.string().min(1, '고객 키가 필요합니다'),
});

export type BillingKeyInput = z.infer<typeof billingKeySchema>;

// =============================================================================
// Zod 스키마 - 체험 연장
// =============================================================================

export const trialExtendSchema = z.object({
  reviewUrl: z
    .string()
    .url('유효한 URL을 입력해주세요')
    .refine(
      (url) => {
        // 네이버 플레이스, 카카오맵, 인스타그램 리뷰 URL 검증
        const validDomains = [
          'naver.me',
          'map.naver.com',
          'place.naver.com',
          'map.kakao.com',
          'place.kakao.com',
          'instagram.com',
          'www.instagram.com',
        ];
        try {
          const urlObj = new URL(url);
          return validDomains.some(domain => urlObj.hostname.includes(domain));
        } catch {
          return false;
        }
      },
      '네이버 플레이스, 카카오맵, 또는 인스타그램 리뷰 URL만 허용됩니다'
    ),
});

export type TrialExtendInput = z.infer<typeof trialExtendSchema>;

// =============================================================================
// Zod 스키마 - 가게 설정
// =============================================================================

export const shopUpdateSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  vibeKeywords: z.array(z.string().min(1).max(20)).min(1).max(3).optional(),
  representMenus: z.array(z.string().min(1).max(30)).min(1).max(3).optional(),
});

export type ShopUpdateInput = z.infer<typeof shopUpdateSchema>;

// =============================================================================
// Zod 스키마 - 히스토리
// =============================================================================

export const historyQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  status: z.enum(['GENERATING', 'READY', 'PUBLISHED', 'FAILED']).optional(),
});

export type HistoryQueryInput = z.infer<typeof historyQuerySchema>;

// =============================================================================
// SSE 이벤트 타입
// =============================================================================

export type ContentGenerationStep =
  | 'start'
  | 'caption_generating'
  | 'caption_done'
  | 'image_generating'
  | 'image_done'
  | 'saving'
  | 'complete'
  | 'error';

export interface SSEEvent {
  step: ContentGenerationStep;
  message: string;
  data?: {
    caption?: string;
    imageUrl?: string;
    thumbnailUrl?: string;
    contentId?: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

// =============================================================================
// 플랜 타입
// =============================================================================

export type PlanType = 'BASIC' | 'PRO';

// =============================================================================
// 플랜 설정
// =============================================================================

export const PLAN_CONFIG: Record<PlanType, {
  price: number;
  regenerateLimit: number;
  name: string;
  description: string;
}> = {
  BASIC: {
    price: 19900,
    regenerateLimit: 3,
    name: 'Basic',
    description: '소규모 카페에 딱 맞는 플랜',
  },
  PRO: {
    price: 39900,
    regenerateLimit: 10,
    name: 'Pro',
    description: '더 많은 창작이 필요한 분들을 위한 플랜',
  },
};

export const TRIAL_DAYS = 14;
export const TRIAL_EXTENSION_DAYS = 7;

// =============================================================================
// 분위기 키워드 옵션
// =============================================================================

export const VIBE_KEYWORDS = [
  '아늑한',
  '감성적',
  '모던한',
  '따뜻한',
  '깔끔한',
  '빈티지',
  '미니멀',
  '화사한',
  '포근한',
  '세련된',
  '자연친화적',
  '힙한',
] as const;

export type VibeKeyword = typeof VIBE_KEYWORDS[number];

// =============================================================================
// 이메일 알림 타입
// =============================================================================

export type EmailNotificationType =
  | 'content_ready'           // 오늘의 콘텐츠 생성 완료
  | 'trial_expiry_reminder'   // 체험 종료 7일 전
  | 'trial_expired'           // 체험 종료
  | 'payment_success'         // 결제 성공
  | 'payment_failed'          // 결제 실패
  | 'subscription_canceled';  // 구독 취소

// =============================================================================
// 토스 웹훅 타입
// =============================================================================

export interface TossWebhookPayload {
  eventType: 'PAYMENT_STATUS_CHANGED' | 'BILLING_KEY_DELETED';
  createdAt: string;
  data: {
    paymentKey?: string;
    orderId?: string;
    status?: string;
    billingKey?: string;
    customerKey?: string;
  };
}

// =============================================================================
// Re-export from utils (순환 참조 방지를 위해 여기서 타입만 정의)
// =============================================================================

export interface SubscriptionCheckResult {
  isActive: boolean;
  reason?: string;
  daysRemaining?: number;
}

// checkSubscriptionStatus 함수는 lib/utils.ts에서 import하여 사용
