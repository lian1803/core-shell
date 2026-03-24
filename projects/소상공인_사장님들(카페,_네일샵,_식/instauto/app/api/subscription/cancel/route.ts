// app/api/subscription/cancel/route.ts
// POST: 구독 취소

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/prisma';
import { ErrorCodes } from '@/types';
import { successResponse, errorResponse, formatDateKST } from '@/lib/utils';
import { sendNotification } from '@/lib/resend/sendNotification';
import { z } from 'zod';

const cancelSchema = z.object({
  reason: z.string().max(500).optional(),
});

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

    // 2. 요청 바디 파싱
    const body = await request.json().catch(() => ({}));
    const validation = cancelSchema.safeParse(body);
    const reason = validation.success ? validation.data.reason : undefined;

    // 3. 구독 정보 조회
    const subscription = await prisma.subscription.findUnique({
      where: { userId: user.id },
    });

    if (!subscription) {
      return NextResponse.json(
        errorResponse(ErrorCodes.NOT_FOUND, '구독 정보가 없습니다'),
        { status: 404 }
      );
    }

    // 4. 취소 가능한 상태인지 확인
    if (subscription.status === 'CANCELED' || subscription.status === 'EXPIRED') {
      return NextResponse.json(
        errorResponse(ErrorCodes.CONFLICT, '이미 취소되었거나 만료된 구독입니다'),
        { status: 409 }
      );
    }

    // 5. 구독 취소 처리
    const now = new Date();

    // TRIAL인 경우: 즉시 CANCELED로 변경
    // ACTIVE인 경우: 현재 기간 끝까지 유지 후 CANCELED
    const updatedSubscription = await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'CANCELED',
        canceledAt: now,
        cancelReason: reason,
      },
    });

    // 6. 서비스 이용 가능 종료일 계산
    let serviceEndDate: Date;
    if (subscription.status === 'TRIAL') {
      serviceEndDate = subscription.trialEndAt;
    } else if (subscription.currentPeriodEnd) {
      serviceEndDate = subscription.currentPeriodEnd;
    } else {
      serviceEndDate = now;
    }

    // 7. 취소 알림 이메일 발송
    try {
      await sendNotification({
        to: user.email!,
        type: 'subscription_canceled',
        data: {
          endDate: serviceEndDate,
        },
      });
    } catch (emailError) {
      console.error('Cancellation email failed:', emailError);
    }

    // 8. 성공 응답
    return NextResponse.json(
      successResponse({
        message: '구독이 취소되었습니다',
        subscription: {
          id: updatedSubscription.id,
          status: updatedSubscription.status,
          canceledAt: updatedSubscription.canceledAt?.toISOString(),
          serviceEndDate: serviceEndDate.toISOString(),
          formattedEndDate: formatDateKST(serviceEndDate),
        },
      })
    );
  } catch (error) {
    console.error('Cancel subscription error:', error);
    return NextResponse.json(
      errorResponse(ErrorCodes.INTERNAL_ERROR, '서버 오류가 발생했습니다'),
      { status: 500 }
    );
  }
}
