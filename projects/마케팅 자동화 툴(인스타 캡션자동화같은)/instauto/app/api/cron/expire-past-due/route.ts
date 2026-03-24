// app/api/cron/expire-past-due/route.ts
// GET: PAST_DUE 구독 중 7일 유예 만료된 것을 EXPIRED로 전환

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { errorResponse } from '@/lib/utils';
import { ErrorCodes } from '@/types';
import { sendNotification } from '@/lib/resend/sendNotification';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // CRON_SECRET 인증
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      errorResponse(ErrorCodes.CRON_UNAUTHORIZED, 'Unauthorized'),
      { status: 401 }
    );
  }

  try {
    // 7일 전 시점 계산 (PAST_DUE가 된 지 7일 지난 것들)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // PAST_DUE 상태이며 currentPeriodEnd가 7일 이상 지난 구독 조회
    const expiredSubscriptions = await prisma.subscription.findMany({
      where: {
        status: 'PAST_DUE',
        currentPeriodEnd: {
          lt: sevenDaysAgo,
        },
      },
      include: {
        user: true,
      },
    });

    let expiredCount = 0;

    for (const subscription of expiredSubscriptions) {
      try {
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: 'EXPIRED' },
        });

        // 구독 만료 알림 이메일
        try {
          await sendNotification({
            to: subscription.user.email,
            type: 'subscription_expired',
            data: {},
          });
        } catch (emailError) {
          console.error(`Failed to send expiry email to ${subscription.user.email}:`, emailError);
        }

        expiredCount++;
      } catch (err) {
        console.error(`Failed to expire subscription ${subscription.id}:`, err);
      }
    }

    console.log(`Expired ${expiredCount} PAST_DUE subscriptions`);

    return NextResponse.json({
      success: true,
      data: { expiredCount },
    });
  } catch (error) {
    console.error('expire-past-due cron error:', error);
    return NextResponse.json(
      errorResponse(ErrorCodes.INTERNAL_ERROR, 'Cron job failed'),
      { status: 500 }
    );
  }
}
