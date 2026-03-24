// app/api/cron/trial-expiry-reminder/route.ts
// GET: 체험 종료 7일 전 이메일 알림 Cron Job
// Vercel Cron: 매일 UTC 00:00 = KST 09:00

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendNotification } from '@/lib/resend/sendNotification';
import { ErrorCodes } from '@/types';
import { successResponse, errorResponse, addDays, getDaysUntil } from '@/lib/utils';

export const runtime = 'nodejs';
export const maxDuration = 60; // 1분 타임아웃

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const results = {
    processed: 0,
    sent: 0,
    failed: 0,
    errors: [] as string[],
  };

  try {
    // 1. CRON_SECRET 검증
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        errorResponse(ErrorCodes.CRON_UNAUTHORIZED, 'Invalid cron secret'),
        { status: 401 }
      );
    }

    // 2. 체험 종료 7일 전인 유저 조회
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const targetDate = addDays(today, 7); // 7일 후
    const targetDateEnd = addDays(today, 8); // 8일 후 (범위 검색용)

    const expiringSubscriptions = await prisma.subscription.findMany({
      where: {
        status: 'TRIAL',
        trialEndAt: {
          gte: targetDate,
          lt: targetDateEnd,
        },
      },
      include: {
        user: {
          include: {
            shop: true,
          },
        },
      },
    });

    console.log(`[Cron] Found ${expiringSubscriptions.length} trial subscriptions expiring in 7 days`);

    // 3. 각 유저에게 이메일 발송
    for (const subscription of expiringSubscriptions) {
      const user = subscription.user;
      results.processed++;

      try {
        const daysRemaining = getDaysUntil(subscription.trialEndAt);

        await sendNotification({
          to: user.email,
          type: 'trial_expiry_reminder',
          data: {
            shopName: user.shop?.name || '사장님',
            daysRemaining,
            trialEndAt: subscription.trialEndAt,
            trialExtended: subscription.trialExtended,
          },
        });

        results.sent++;
        console.log(`[Cron] Reminder sent to ${user.email}`);

        // Rate limiting - 100ms 간격
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        results.failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push(`${user.email}: ${errorMessage}`);
        console.error(`[Cron] Failed to send reminder to ${user.email}:`, error);
      }
    }

    // 4. 체험 만료된 유저 상태 업데이트 (trialEndAt < today)
    const expiredCount = await prisma.subscription.updateMany({
      where: {
        status: 'TRIAL',
        trialEndAt: {
          lt: today,
        },
      },
      data: {
        status: 'EXPIRED',
      },
    });

    if (expiredCount.count > 0) {
      console.log(`[Cron] Marked ${expiredCount.count} subscriptions as expired`);

      // 만료된 유저들에게 만료 알림 이메일
      const expiredUsers = await prisma.subscription.findMany({
        where: {
          status: 'EXPIRED',
          updatedAt: {
            gte: new Date(Date.now() - 60000), // 방금 업데이트된 것들
          },
        },
        include: {
          user: true,
        },
      });

      for (const sub of expiredUsers) {
        try {
          await sendNotification({
            to: sub.user.email,
            type: 'trial_expired',
            data: {},
          });
        } catch {
          // 무시
        }
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[Cron] Trial reminder completed in ${duration}ms:`, results);

    return NextResponse.json(
      successResponse({
        message: 'Trial expiry reminder completed',
        results: {
          ...results,
          expiredCount: expiredCount.count,
        },
        duration: `${duration}ms`,
      })
    );
  } catch (error) {
    console.error('[Cron] Fatal error:', error);
    return NextResponse.json(
      errorResponse(ErrorCodes.INTERNAL_ERROR, 'Cron job failed'),
      { status: 500 }
    );
  }
}
