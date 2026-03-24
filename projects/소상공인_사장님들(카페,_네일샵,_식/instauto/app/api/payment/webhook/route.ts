// app/api/payment/webhook/route.ts
// POST: 토스페이먼츠 웹훅 처리 (정기 결제 성공/실패)

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { TossWebhookPayload, ErrorCodes, PLAN_CONFIG } from '@/types';
import { errorResponse, addDays, generateOrderId } from '@/lib/utils';
import { verifyWebhookSignature, getPayment } from '@/lib/toss/payment';
import { sendNotification } from '@/lib/resend/sendNotification';

export async function POST(request: NextRequest) {
  try {
    // 1. 원본 페이로드 추출
    const rawBody = await request.text();

    // 2. 시그니처 검증
    const signature = request.headers.get('toss-signature') || '';

    if (!verifyWebhookSignature(rawBody, signature)) {
      console.error('Webhook signature verification failed');
      return NextResponse.json(
        errorResponse(ErrorCodes.UNAUTHORIZED, 'Invalid webhook signature'),
        { status: 401 }
      );
    }

    // 3. 페이로드 파싱
    const payload: TossWebhookPayload = JSON.parse(rawBody);
    console.log('Toss webhook received:', payload.eventType);

    // 4. 이벤트 타입별 처리
    switch (payload.eventType) {
      case 'PAYMENT_STATUS_CHANGED':
        await handlePaymentStatusChanged(payload);
        break;

      case 'BILLING_KEY_DELETED':
        await handleBillingKeyDeleted(payload);
        break;

      default:
        console.log('Unknown webhook event type:', payload.eventType);
    }

    // 5. 성공 응답 (토스에 200 반환 필수)
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    // 웹훅 처리 실패해도 200 반환 (재시도 방지)
    return NextResponse.json({ success: false, message: 'Webhook processing failed' });
  }
}

/**
 * 결제 상태 변경 처리 (정기 결제 성공/실패)
 */
async function handlePaymentStatusChanged(payload: TossWebhookPayload) {
  const { paymentKey, orderId, status } = payload.data;

  if (!paymentKey || !orderId || !status) {
    console.error('Missing required fields in webhook payload');
    return;
  }

  // Payment 레코드 조회
  const payment = await prisma.payment.findUnique({
    where: { tossOrderId: orderId },
    include: {
      user: {
        include: {
          subscription: true,
        },
      },
    },
  });

  if (!payment) {
    console.log('Payment not found for orderId:', orderId);
    return;
  }

  const now = new Date();

  switch (status) {
    case 'DONE':
      // 멱등성: 이미 DONE이면 중복 처리 방지
      if (payment.status === 'DONE') {
        console.log('Payment already processed (idempotent):', orderId);
        return;
      }
      // 정기 결제 성공
      await prisma.$transaction(async (tx) => {
        // Payment 상태 업데이트
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: 'DONE',
            paidAt: now,
          },
        });

        // Subscription 기간 연장
        if (payment.user.subscription) {
          const newPeriodEnd = addDays(now, 30);
          await tx.subscription.update({
            where: { id: payment.user.subscription.id },
            data: {
              status: 'ACTIVE',
              currentPeriodStart: now,
              currentPeriodEnd: newPeriodEnd,
            },
          });
        }
      });

      // 결제 성공 이메일
      try {
        await sendNotification({
          to: payment.user.email,
          type: 'payment_success',
          data: {
            plan: PLAN_CONFIG[payment.plan].name,
            amount: payment.amount,
            periodEnd: addDays(now, 30),
          },
        });
      } catch (e) {
        console.error('Payment success email failed:', e);
      }
      break;

    case 'CANCELED':
      // 결제 취소
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'CANCELED',
          canceledAt: now,
        },
      });
      break;

    case 'FAILED':
    case 'ABORTED':
    case 'EXPIRED':
      // 결제 실패
      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: 'FAILED',
            failedAt: now,
            failReason: status,
          },
        });

        // Subscription을 PAST_DUE로 변경 (7일 유예)
        if (payment.user.subscription) {
          await tx.subscription.update({
            where: { id: payment.user.subscription.id },
            data: {
              status: 'PAST_DUE',
            },
          });
        }
      });

      // 결제 실패 이메일
      try {
        await sendNotification({
          to: payment.user.email,
          type: 'payment_failed',
          data: {
            reason: getFailureReason(status),
          },
        });
      } catch (e) {
        console.error('Payment failed email failed:', e);
      }
      break;

    default:
      console.log('Unhandled payment status:', status);
  }
}

/**
 * 빌링키 삭제 처리
 */
async function handleBillingKeyDeleted(payload: TossWebhookPayload) {
  const { customerKey } = payload.data;

  if (!customerKey) {
    console.error('Missing customerKey in billing key deleted webhook');
    return;
  }

  // 해당 고객의 구독 찾기
  const subscription = await prisma.subscription.findFirst({
    where: { tossCustomerKey: customerKey },
    include: { user: true },
  });

  if (!subscription) {
    console.log('Subscription not found for customerKey:', customerKey);
    return;
  }

  // 빌링키 제거
  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      tossBillingKey: null,
    },
  });

  console.log('Billing key removed for user:', subscription.userId);
}

/**
 * 결제 실패 사유 메시지
 */
function getFailureReason(status: string): string {
  const reasons: Record<string, string> = {
    FAILED: '결제가 실패했습니다. 카드 정보를 확인해주세요.',
    ABORTED: '결제가 취소되었습니다.',
    EXPIRED: '결제 유효 시간이 만료되었습니다.',
  };
  return reasons[status] || '결제 처리 중 오류가 발생했습니다.';
}
