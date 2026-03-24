// app/api/trial/extend/route.ts
// POST: 리뷰 작성으로 체험 기간 연장 (+7일)

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/prisma';
import { trialExtendSchema, ErrorCodes, TRIAL_EXTENSION_DAYS } from '@/types';
import { successResponse, errorResponse, addDays, formatDateKST } from '@/lib/utils';

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
    const validation = trialExtendSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      return NextResponse.json(
        errorResponse(ErrorCodes.VALIDATION_ERROR, firstError.message),
        { status: 400 }
      );
    }

    const { reviewUrl } = validation.data;

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

    // 4. TRIAL 상태인지 확인
    if (subscription.status !== 'TRIAL') {
      return NextResponse.json(
        errorResponse(ErrorCodes.CONFLICT, '무료 체험 중인 경우에만 연장할 수 있습니다'),
        { status: 409 }
      );
    }

    // 5. 이미 연장했는지 확인
    if (subscription.trialExtended) {
      return NextResponse.json(
        errorResponse(ErrorCodes.TRIAL_ALREADY_EXTENDED, '이미 체험 기간을 연장했습니다'),
        { status: 409 }
      );
    }

    // 6. 리뷰 URL 추가 검증 (실제 존재 여부 - 간단한 HTTP 체크)
    try {
      const urlResponse = await fetch(reviewUrl, {
        method: 'HEAD',
        redirect: 'follow',
      });

      if (!urlResponse.ok) {
        return NextResponse.json(
          errorResponse(ErrorCodes.INVALID_REVIEW_URL, '유효하지 않은 리뷰 URL입니다'),
          { status: 400 }
        );
      }
    } catch {
      // URL 접근 실패 시에도 일단 허용 (네트워크 이슈 가능성)
      console.warn('Review URL validation failed, proceeding anyway:', reviewUrl);
    }

    // 7. 체험 기간 연장
    const now = new Date();
    const newTrialEndAt = addDays(subscription.trialEndAt, TRIAL_EXTENSION_DAYS);

    const updatedSubscription = await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        trialEndAt: newTrialEndAt,
        trialExtended: true,
        trialExtendedAt: now,
        reviewUrl,
      },
    });

    // 8. 성공 응답
    return NextResponse.json(
      successResponse({
        message: `체험 기간이 ${TRIAL_EXTENSION_DAYS}일 연장되었습니다`,
        subscription: {
          id: updatedSubscription.id,
          status: updatedSubscription.status,
          trialEndAt: updatedSubscription.trialEndAt.toISOString(),
          trialExtended: updatedSubscription.trialExtended,
          formattedEndDate: formatDateKST(updatedSubscription.trialEndAt),
        },
      })
    );
  } catch (error) {
    console.error('Trial extend error:', error);
    return NextResponse.json(
      errorResponse(ErrorCodes.INTERNAL_ERROR, '서버 오류가 발생했습니다'),
      { status: 500 }
    );
  }
}
