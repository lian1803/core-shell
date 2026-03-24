// lib/toss/payment.ts
// 토스페이먼츠 결제 처리

import { PlanType, PLAN_CONFIG } from '@/types';
import { encrypt, decrypt } from '@/lib/utils';

const TOSS_API_URL = 'https://api.tosspayments.com/v1';

function getTossSecretKey(): string {
  const secretKey = process.env.TOSS_SECRET_KEY;
  if (!secretKey) {
    throw new Error('TOSS_SECRET_KEY environment variable is not set');
  }
  return secretKey;
}

function getAuthHeader(): string {
  const secretKey = getTossSecretKey();
  const encoded = Buffer.from(`${secretKey}:`).toString('base64');
  return `Basic ${encoded}`;
}

// =============================================================================
// 타입 정의
// =============================================================================

export interface TossPaymentConfirmRequest {
  paymentKey: string;
  orderId: string;
  amount: number;
}

export interface TossPaymentResponse {
  paymentKey: string;
  orderId: string;
  status: string;
  totalAmount: number;
  method: string;
  approvedAt: string;
  card?: {
    company: string;
    number: string;
    installmentPlanMonths: number;
  };
  virtualAccount?: {
    bankCode: string;
    accountNumber: string;
    dueDate: string;
  };
}

export interface TossBillingKeyRequest {
  authKey: string;
  customerKey: string;
}

export interface TossBillingKeyResponse {
  billingKey: string;
  customerKey: string;
  cardCompany: string;
  cardNumber: string;
  authenticatedAt: string;
}

export interface TossBillingPaymentRequest {
  billingKey: string;
  customerKey: string;
  amount: number;
  orderId: string;
  orderName: string;
}

// =============================================================================
// 결제 확인
// =============================================================================

/**
 * 일반 결제 확인 (카드 결제 등)
 */
export async function confirmPayment(
  request: TossPaymentConfirmRequest
): Promise<TossPaymentResponse> {
  const response = await fetch(`${TOSS_API_URL}/payments/confirm`, {
    method: 'POST',
    headers: {
      'Authorization': getAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `Toss payment confirm failed: ${response.status}`);
  }

  return response.json();
}

/**
 * 결제 조회
 */
export async function getPayment(paymentKey: string): Promise<TossPaymentResponse> {
  const response = await fetch(`${TOSS_API_URL}/payments/${paymentKey}`, {
    method: 'GET',
    headers: {
      'Authorization': getAuthHeader(),
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `Toss payment query failed: ${response.status}`);
  }

  return response.json();
}

// =============================================================================
// 정기 결제 (빌링)
// =============================================================================

/**
 * 빌링키 발급 (카드 자동 결제용)
 */
export async function issueBillingKey(
  request: TossBillingKeyRequest
): Promise<TossBillingKeyResponse> {
  const response = await fetch(`${TOSS_API_URL}/billing/authorizations/issue`, {
    method: 'POST',
    headers: {
      'Authorization': getAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `Toss billing key issue failed: ${response.status}`);
  }

  return response.json();
}

/**
 * 빌링키로 결제 (정기 결제 실행)
 */
export async function payWithBillingKey(
  request: TossBillingPaymentRequest
): Promise<TossPaymentResponse> {
  const response = await fetch(`${TOSS_API_URL}/billing/${request.billingKey}`, {
    method: 'POST',
    headers: {
      'Authorization': getAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      customerKey: request.customerKey,
      amount: request.amount,
      orderId: request.orderId,
      orderName: request.orderName,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `Toss billing payment failed: ${response.status}`);
  }

  return response.json();
}

// =============================================================================
// 결제 취소
// =============================================================================

export interface TossCancelRequest {
  paymentKey: string;
  cancelReason: string;
  cancelAmount?: number; // 부분 취소 시
}

export async function cancelPayment(request: TossCancelRequest): Promise<TossPaymentResponse> {
  const response = await fetch(`${TOSS_API_URL}/payments/${request.paymentKey}/cancel`, {
    method: 'POST',
    headers: {
      'Authorization': getAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      cancelReason: request.cancelReason,
      ...(request.cancelAmount && { cancelAmount: request.cancelAmount }),
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `Toss payment cancel failed: ${response.status}`);
  }

  return response.json();
}

// =============================================================================
// 유틸리티
// =============================================================================

/**
 * 빌링키 암호화 저장
 */
export function encryptBillingKey(billingKey: string): string {
  return encrypt(billingKey);
}

/**
 * 빌링키 복호화
 */
export function decryptBillingKey(encryptedBillingKey: string): string {
  return decrypt(encryptedBillingKey);
}

/**
 * 플랜별 결제 금액 조회
 */
export function getPlanAmount(plan: PlanType): number {
  return PLAN_CONFIG[plan].price;
}

/**
 * 주문명 생성
 */
export function getOrderName(plan: PlanType): string {
  return `Instauto ${PLAN_CONFIG[plan].name} 플랜 (월간)`;
}

/**
 * 정기 결제 실행 (Cron Job에서 호출)
 */
export async function executeRecurringPayment(
  encryptedBillingKey: string,
  customerKey: string,
  plan: PlanType,
  orderId: string
): Promise<TossPaymentResponse> {
  const billingKey = decryptBillingKey(encryptedBillingKey);
  const amount = getPlanAmount(plan);
  const orderName = getOrderName(plan);

  return payWithBillingKey({
    billingKey,
    customerKey,
    amount,
    orderId,
    orderName,
  });
}

// =============================================================================
// 웹훅 검증
// =============================================================================

/**
 * 토스 웹훅 시그니처 검증
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string
): boolean {
  const crypto = require('crypto');
  const webhookSecret = process.env.TOSS_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('TOSS_WEBHOOK_SECRET is not set');
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(payload)
    .digest('base64');

  return signature === expectedSignature;
}
