// app/api/me/route.ts
// GET: 현재 로그인 유저 정보 조회

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/prisma';
import { ErrorCodes, PLAN_CONFIG } from '@/types';
import { successResponse, errorResponse, checkSubscriptionStatus, getKSTDateString } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    // 인증 확인
    const supabase = await createClient();
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json(
        errorResponse(ErrorCodes.UNAUTHORIZED, '로그인이 필요합니다'),
        { status: 401 }
      );
    }

    // 유저 정보 조회 (Shop, Subscription, 오늘의 콘텐츠 포함)
    const today = getKSTDateString();
    const todayDate = new Date(today);

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      include: {
        shop: true,
        subscription: true,
        contents: {
          where: {
            targetDate: todayDate,
          },
          take: 1,
        },
      },
    });

    if (!user) {
      // Supabase Auth에는 있지만 DB에 없는 경우 (최초 로그인)
      return NextResponse.json(
        successResponse({
          user: {
            id: authUser.id,
            email: authUser.email,
            name: authUser.user_metadata?.full_name || null,
            avatarUrl: authUser.user_metadata?.avatar_url || null,
          },
          shop: null,
          subscription: null,
          todayContent: null,
          needsOnboarding: true,
        })
      );
    }

    // 구독 상태 체크
    let subscriptionData = null;
    if (user.subscription) {
      const statusCheck = checkSubscriptionStatus(
        user.subscription.status,
        user.subscription.trialEndAt,
        user.subscription.currentPeriodEnd
      );

      const planConfig = PLAN_CONFIG[user.subscription.plan];

      subscriptionData = {
        id: user.subscription.id,
        plan: user.subscription.plan,
        planName: planConfig.name,
        regenerateLimit: planConfig.regenerateLimit,
        status: user.subscription.status,
        isActive: statusCheck.isActive,
        daysRemaining: statusCheck.daysRemaining,
        trialEndAt: user.subscription.trialEndAt.toISOString(),
        trialExtended: user.subscription.trialExtended,
        canExtendTrial: user.subscription.status === 'TRIAL' && !user.subscription.trialExtended,
      };
    }

    // 오늘의 콘텐츠
    const todayContent = user.contents[0];
    let todayContentData = null;
    if (todayContent) {
      todayContentData = {
        id: todayContent.id,
        status: todayContent.status,
        thumbnailUrl: todayContent.thumbnailUrl,
        hasContent: todayContent.status === 'READY' || todayContent.status === 'PUBLISHED',
      };
    }

    return NextResponse.json(
      successResponse({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
          createdAt: user.createdAt.toISOString(),
        },
        shop: user.shop
          ? {
              id: user.shop.id,
              name: user.shop.name,
              industry: user.shop.industry,
              vibeKeywords: user.shop.vibeKeywords,
              representMenus: user.shop.representMenus,
            }
          : null,
        subscription: subscriptionData,
        todayContent: todayContentData,
        needsOnboarding: !user.shop,
      })
    );
  } catch (error) {
    console.error('Get me error:', error);
    return NextResponse.json(
      errorResponse(ErrorCodes.INTERNAL_ERROR, '서버 오류가 발생했습니다'),
      { status: 500 }
    );
  }
}
