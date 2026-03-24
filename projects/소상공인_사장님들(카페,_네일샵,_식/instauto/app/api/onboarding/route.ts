// app/api/onboarding/route.ts
// POST: 온보딩 - 가게 정보 저장 + 구독 생성

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/prisma';
import { onboardingSchema, ErrorCodes, TRIAL_DAYS } from '@/types';
import { successResponse, errorResponse, addDays } from '@/lib/utils';

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

    // 2. 요청 바디 파싱 및 검증
    const body = await request.json();
    const validation = onboardingSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      return NextResponse.json(
        errorResponse(ErrorCodes.VALIDATION_ERROR, firstError.message),
        { status: 400 }
      );
    }

    const { shopName, industry, vibeKeywords, representMenus } = validation.data;

    // 3. 이미 Shop이 있는지 확인
    const existingShop = await prisma.shop.findUnique({
      where: { userId: user.id },
    });

    if (existingShop) {
      return NextResponse.json(
        errorResponse(ErrorCodes.ALREADY_EXISTS, '이미 가게 정보가 등록되어 있습니다'),
        { status: 409 }
      );
    }

    // 4. 트랜잭션으로 Shop + Subscription 생성
    const now = new Date();
    const trialEndAt = addDays(now, TRIAL_DAYS);

    const result = await prisma.$transaction(async (tx) => {
      // Shop 생성
      const shop = await tx.shop.create({
        data: {
          userId: user.id,
          name: shopName,
          industry: industry || 'cafe',
          vibeKeywords,
          representMenus,
        },
      });

      // Subscription 생성 (14일 무료 체험)
      const subscription = await tx.subscription.create({
        data: {
          userId: user.id,
          plan: 'BASIC',
          status: 'TRIAL',
          trialStartAt: now,
          trialEndAt,
        },
      });

      return { shop, subscription };
    });

    // 5. 성공 응답
    return NextResponse.json(
      successResponse({
        shop: {
          id: result.shop.id,
          name: result.shop.name,
          industry: result.shop.industry,
          vibeKeywords: result.shop.vibeKeywords,
          representMenus: result.shop.representMenus,
        },
        subscription: {
          id: result.subscription.id,
          plan: result.subscription.plan,
          status: result.subscription.status,
          trialEndAt: result.subscription.trialEndAt.toISOString(),
        },
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error('Onboarding error:', error);

    // Prisma unique constraint 에러 처리
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        errorResponse(ErrorCodes.ALREADY_EXISTS, '이미 가게 정보가 등록되어 있습니다'),
        { status: 409 }
      );
    }

    return NextResponse.json(
      errorResponse(ErrorCodes.INTERNAL_ERROR, '서버 오류가 발생했습니다'),
      { status: 500 }
    );
  }
}
