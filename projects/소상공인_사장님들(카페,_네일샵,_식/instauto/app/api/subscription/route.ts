// app/api/subscription/route.ts
// GET: 현재 구독 정보 조회

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/prisma';
import { ErrorCodes, PLAN_CONFIG } from '@/types';
import { successResponse, errorResponse, checkSubscriptionStatus, getDaysUntil } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    // 인증 확인
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        errorResponse(ErrorCodes.UNAUTHORIZED, '로그인이 필요합니다'),
        { status: 401 }
      );
    }

    // 구독 정보 조회
    const subscription = await prisma.subscription.findUnique({
      where: { userId: user.id },
    });

    if (!subscription) {
      return NextResponse.json(
        errorResponse(ErrorCodes.NOT_FOUND, '구독 정보가 없습니다'),
        { status: 404 }
      );
    }

    // 구독 상태 체크
    const statusCheck = checkSubscriptionStatus(
      subscription.status,
      subscription.trialEndAt,
      subscription.currentPeriodEnd
    );

    // 플랜 정보
    const planConfig = PLAN_CONFIG[subscription.plan];

    // 응답 데이터 구성
    const responseData: Record<string, unknown> = {
      id: subscription.id,
      plan: subscription.plan,
      planName: planConfig.name,
      planPrice: planConfig.price,
      regenerateLimit: planConfig.regenerateLimit,
      status: subscription.status,
      isActive: statusCheck.isActive,
      daysRemaining: statusCheck.daysRemaining,
    };

    // 상태별 추가 정보
    if (subscription.status === 'TRIAL') {
      responseData.trialStartAt = subscription.trialStartAt.toISOString();
      responseData.trialEndAt = subscription.trialEndAt.toISOString();
      responseData.trialExtended = subscription.trialExtended;
      responseData.canExtendTrial = !subscription.trialExtended;
    }

    if (subscription.status === 'ACTIVE' || subscription.status === 'PAST_DUE') {
      responseData.currentPeriodStart = subscription.currentPeriodStart?.toISOString();
      responseData.currentPeriodEnd = subscription.currentPeriodEnd?.toISOString();
    }

    if (subscription.status === 'CANCELED') {
      responseData.canceledAt = subscription.canceledAt?.toISOString();
      responseData.cancelReason = subscription.cancelReason;
    }

    return NextResponse.json(successResponse({ subscription: responseData }));
  } catch (error) {
    console.error('Get subscription error:', error);
    return NextResponse.json(
      errorResponse(ErrorCodes.INTERNAL_ERROR, '서버 오류가 발생했습니다'),
      { status: 500 }
    );
  }
}
