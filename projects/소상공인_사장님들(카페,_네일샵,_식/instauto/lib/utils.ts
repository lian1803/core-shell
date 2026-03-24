// lib/utils.ts
// 유틸리티 함수들

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import crypto from 'crypto';
import { ApiResponse, ErrorCode, PLAN_CONFIG, PlanType } from '@/types';

// =============================================================================
// Tailwind CSS 클래스 병합 (shadcn/ui용)
// =============================================================================

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// =============================================================================
// API 응답 헬퍼
// =============================================================================

export function successResponse<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
  };
}

export function errorResponse(code: ErrorCode, message: string): ApiResponse<never> {
  return {
    success: false,
    error: {
      code,
      message,
    },
  };
}

// =============================================================================
// AES-256-GCM 암호화/복호화 (Instagram Access Token용)
// =============================================================================

const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  }
  // 32바이트 키 필요 (256비트)
  return crypto.scryptSync(key, 'salt', 32);
}

export function encrypt(text: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // IV + AuthTag + EncryptedData 를 합쳐서 반환
  return iv.toString('hex') + authTag.toString('hex') + encrypted;
}

export function decrypt(encryptedText: string): string {
  const key = getEncryptionKey();

  // IV, AuthTag, EncryptedData 분리
  const iv = Buffer.from(encryptedText.slice(0, IV_LENGTH * 2), 'hex');
  const authTag = Buffer.from(
    encryptedText.slice(IV_LENGTH * 2, IV_LENGTH * 2 + AUTH_TAG_LENGTH * 2),
    'hex'
  );
  const encrypted = encryptedText.slice(IV_LENGTH * 2 + AUTH_TAG_LENGTH * 2);

  const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

// =============================================================================
// 재생성 횟수 체크
// =============================================================================

export interface RegenerateCheckResult {
  canRegenerate: boolean;
  remaining: number;
  limit: number;
}

export function canRegenerate(
  plan: PlanType,
  currentCount: number,
  lastRegenerateAt: Date | null
): RegenerateCheckResult {
  const limit = PLAN_CONFIG[plan].regenerateLimit;

  // 마지막 재생성이 오늘이 아니면 카운트 리셋
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let effectiveCount = currentCount;
  if (lastRegenerateAt) {
    const lastDate = new Date(lastRegenerateAt);
    lastDate.setHours(0, 0, 0, 0);
    if (lastDate < today) {
      effectiveCount = 0;
    }
  } else {
    effectiveCount = 0;
  }

  const remaining = Math.max(0, limit - effectiveCount);

  return {
    canRegenerate: effectiveCount < limit,
    remaining,
    limit,
  };
}

// =============================================================================
// 날짜 유틸리티
// =============================================================================

export function getKSTDate(): Date {
  const now = new Date();
  // UTC + 9시간 = KST
  return new Date(now.getTime() + 9 * 60 * 60 * 1000);
}

export function getKSTDateString(): string {
  const kst = getKSTDate();
  return kst.toISOString().split('T')[0];
}

export function formatDateKST(date: Date): string {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Seoul',
  }).format(date);
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function getDaysUntil(targetDate: Date): number {
  const now = new Date();
  const diff = targetDate.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// =============================================================================
// ID 생성
// =============================================================================

export function generateOrderId(): string {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(4).toString('hex');
  return `ORDER_${timestamp}_${random}`.toUpperCase();
}

export function generateCustomerKey(): string {
  return crypto.randomUUID();
}

// =============================================================================
// 검증 유틸리티
// =============================================================================

export function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

export function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
}

// =============================================================================
// 구독 상태 체크
// =============================================================================

export interface SubscriptionCheckResult {
  isActive: boolean;
  reason?: string;
  daysRemaining?: number;
}

export function checkSubscriptionStatus(
  status: string,
  trialEndAt: Date | null,
  currentPeriodEnd: Date | null
): SubscriptionCheckResult {
  const now = new Date();

  if (status === 'TRIAL') {
    if (!trialEndAt) {
      return { isActive: false, reason: 'TRIAL_END_NOT_SET' };
    }
    if (now > trialEndAt) {
      return { isActive: false, reason: 'TRIAL_EXPIRED' };
    }
    const daysRemaining = getDaysUntil(trialEndAt);
    return { isActive: true, daysRemaining };
  }

  if (status === 'ACTIVE') {
    if (currentPeriodEnd && now > currentPeriodEnd) {
      return { isActive: false, reason: 'SUBSCRIPTION_EXPIRED' };
    }
    const daysRemaining = currentPeriodEnd ? getDaysUntil(currentPeriodEnd) : undefined;
    return { isActive: true, daysRemaining };
  }

  if (status === 'PAST_DUE') {
    // 결제 실패 후 7일 유예
    return { isActive: true, reason: 'PAYMENT_OVERDUE', daysRemaining: 7 };
  }

  return { isActive: false, reason: status };
}

// =============================================================================
// 환경변수 검증
// =============================================================================

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// =============================================================================
// SSE 헬퍼
// =============================================================================

export function createSSEMessage(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

// =============================================================================
// 문자열 유틸리티
// =============================================================================

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
