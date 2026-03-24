// app/api/payment/confirm/route.ts
// POST: 토스페이먼츠 결제 확인 및 구독 활성화

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/prisma';
import { paymentConfirmSchema, ErrorCodes, PLAN_CONFIG } from '@/types';
import { successResponse, errorResponse, addDays, generateCustomerKey } from '@/lib/utils';
import { confirmPayment, issueBillingKey, encryptBillingKey } from '@/lib/toss/payment';
import { sendNotification } from '@/lib/resend/sendNotification';
import { PlanType } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    // 1. 인증 확인
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        errorResponse(ErrorCodes.UNAUTHORIZED, '로그인이 필요합니다'),
        { status: 401 }
      );
    }

    // 2. 요청 바디 검증
    const body = await request.json();
    const validation = paymentConfirmSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      return NextResponse.json(
        errorResponse(ErrorCodes.VALIDATION_ERROR, firstError.message),
        { status: 400 }
      );
    }

    const { paymentKey, orderId, amount } = validation.data;

    // 3. 중복 결제 검증 (orderId 중복 체크)
    const existingPayment = await prisma.payment.findUnique({
      where: { tossOrderId: orderId },
    });

    if (existingPayment) {
      return NextResponse.json(
        errorResponse(ErrorCodes.CONFLICT, '이미 처리된 결제입니다'),
        { status: 409 }
      );
    }

    // 4. 플랜 확인 (amount로 플랜 결정)
    let plan: PlanType = 'BASIC';
    if (amount === PLAN_CONFIG.PRO.price) {
      plan = 'PRO';
    } else if (amount !== PLAN_CONFIG.BASIC.price) {
      return NextResponse.json(
        errorResponse(ErrorCodes.VALIDATION_ERROR, '유효하지 않은 결제 금액입니다'),
        { status: 400 }
      );
    }

    // 5. 토스 결제 확인
    let tossPayment;
    try {
      tossPayment = await confirmPayment({ paymentKey, orderId, amount });
    } catch (error) {
      console.error('Toss payment confirm error:', error);
      return NextResponse.json(
        errorResponse(ErrorCodes.PAYMENT_ERROR, '결제 확인에 실패했습니다'),
        { status: 400 }
      );
    }

    // 6. 결제 성공 확인
    if (tossPayment.status !== 'DONE') {
      return NextResponse.json(
        errorResponse(ErrorCodes.PAYMENT_ERROR, '결제가 완료되지 않았습니다'),
        { status: 400 }
      );
    }

    // 7. 트랜잭션으로 Payment + Subscription 업데이트
    const now = new Date();
    const periodEnd = addDays(now, 30); // 30일 구독 기간

    const result = await prisma.$transaction(async (tx) => {
      // Payment 레코드 생성
      const payment = await tx.payment.create({
        data: {
          userId: user.id,
          tossPaymentKey: paymentKey,
          tossOrderId: orderId,
          amount,
          plan,
          status: 'DONE',
          paidAt: now,
        },
      });

      // Subscription 업데이트
      const subscription = await tx.subscription.upsert({
        where: { userId: user.id },
        update: {
          plan,
          status: 'ACTIVE',
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          tossCustomerKey: generateCustomerKey(),
        },
        create: {
          userId: user.id,
          plan,
          status: 'ACTIVE',
          trialStartAt: now,
          trialEndAt: now,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          tossCustomerKey: generateCustomerKey(),
        },
      });

      return { payment, subscription };
    });

    // 8. 결제 완료 이메일 발송
    try {
      await sendNotification({
        to: user.email!,
        type: 'payment_success',
        data: {
          plan: PLAN_CONFIG[plan].name,
          amount,
          periodEnd,
        },
      });
    } catch (emailError) {
      console.error('Payment success email failed:', emailError);
      // 이메일 실패는 무시
    }

    // 9. 성공 응답
    return NextResponse.json(
      successResponse({
        payment: {
          id: result.payment.id,
          amount: result.payment.amount,
          plan: result.payment.plan,
          status: result.payment.status,
        },
        subscription: {
          id: result.subscription.id,
          plan: result.subscription.plan,
          status: result.subscription.status,
          currentPeriodEnd: result.subscription.currentPeriodEnd?.toISOString(),
        },
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error('Payment confirm error:', error);
    return NextResponse.json(
      errorResponse(ErrorCodes.INTERNAL_ERROR, '서버 오류가 발생했습니다'),
      { status: 500 }
    );
  }
}
