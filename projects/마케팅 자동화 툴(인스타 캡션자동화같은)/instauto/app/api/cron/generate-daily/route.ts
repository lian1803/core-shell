// app/api/cron/generate-daily/route.ts
// GET: 매일 오전 8시 (KST) 자동 콘텐츠 생성 Cron Job
// Vercel Cron: UTC 23:00 = KST 08:00

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { generateCaption } from '@/lib/openai/generateCaption';
import { generateImage } from '@/lib/openai/generateImage';
import { saveImageToStorage } from '@/lib/storage/saveImage';
import { sendNotification, sendBulkNotifications } from '@/lib/resend/sendNotification';
import { ErrorCodes } from '@/types';
import { successResponse, errorResponse, getKSTDateString } from '@/lib/utils';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5분 타임아웃

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const results = {
    processed: 0,
    success: 0,
    failed: 0,
    skipped: 0,
    errors: [] as string[],
  };

  try {
    // 1. CRON_SECRET 검증 (middleware에서 이미 했지만 이중 체크)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        errorResponse(ErrorCodes.CRON_UNAUTHORIZED, 'Invalid cron secret'),
        { status: 401 }
      );
    }

    // 2. 활성 구독 유저 조회 (TRIAL 또는 ACTIVE)
    const today = getKSTDateString();
    const todayDate = new Date(today);

    const activeSubscriptions = await prisma.subscription.findMany({
      where: {
        OR: [
          {
            status: 'TRIAL',
            trialEndAt: { gte: todayDate },
          },
          {
            status: 'ACTIVE',
            currentPeriodEnd: { gte: todayDate },
          },
        ],
      },
      include: {
        user: {
          include: {
            shop: true,
            contents: {
              where: {
                targetDate: todayDate,
              },
            },
          },
        },
      },
    });

    console.log(`[Cron] Found ${activeSubscriptions.length} active subscriptions`);

    // 3. 각 유저별 콘텐츠 생성
    for (const subscription of activeSubscriptions) {
      const user = subscription.user;
      const shop = user.shop;

      results.processed++;

      // Shop이 없으면 스킵
      if (!shop) {
        results.skipped++;
        console.log(`[Cron] User ${user.id} skipped - no shop`);
        continue;
      }

      // 오늘 콘텐츠가 이미 있으면 스킵
      if (user.contents.length > 0 && user.contents[0].status !== 'FAILED') {
        results.skipped++;
        console.log(`[Cron] User ${user.id} skipped - content already exists`);
        continue;
      }

      try {
        // 콘텐츠 ID 생성
        const contentId = crypto.randomUUID();

        // 캡션 생성
        console.log(`[Cron] Generating caption for user ${user.id}`);
        const captionResult = await generateCaption({ shop });

        // 이미지 생성
        console.log(`[Cron] Generating image for user ${user.id}`);
        const imageResult = await generateImage({ shop });

        // Storage에 저장
        console.log(`[Cron] Saving image for user ${user.id}`);
        const storageResult = await saveImageToStorage({
          userId: user.id,
          contentId,
          sourceUrl: imageResult.imageUrl,
        });

        // DB에 저장
        await prisma.content.upsert({
          where: {
            userId_targetDate: {
              userId: user.id,
              targetDate: todayDate,
            },
          },
          update: {
            caption: captionResult.caption,
            imageUrl: storageResult.originalUrl,
            thumbnailUrl: storageResult.thumbnailUrl,
            promptUsed: imageResult.promptUsed,
            captionPromptUsed: captionResult.promptUsed,
            status: 'READY',
          },
          create: {
            id: contentId,
            userId: user.id,
            caption: captionResult.caption,
            imageUrl: storageResult.originalUrl,
            thumbnailUrl: storageResult.thumbnailUrl,
            promptUsed: imageResult.promptUsed,
            captionPromptUsed: captionResult.promptUsed,
            status: 'READY',
            targetDate: todayDate,
          },
        });

        results.success++;
        console.log(`[Cron] Content created for user ${user.id}`);

        // 개별 이메일 발송
        try {
          await sendNotification({
            to: user.email,
            type: 'content_ready',
            data: {
              shopName: shop.name,
              thumbnailUrl: storageResult.thumbnailUrl,
            },
          });
        } catch (emailError) {
          console.error(`[Cron] Email failed for user ${user.id}:`, emailError);
        }

        // Rate limiting - 각 유저 처리 후 1초 대기
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        results.failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push(`User ${user.id}: ${errorMessage}`);
        console.error(`[Cron] Failed for user ${user.id}:`, error);

        // FAILED 상태로 저장
        try {
          await prisma.content.upsert({
            where: {
              userId_targetDate: {
                userId: user.id,
                targetDate: todayDate,
              },
            },
            update: {
              status: 'FAILED',
            },
            create: {
              userId: user.id,
              caption: '',
              imageUrl: '',
              status: 'FAILED',
              targetDate: todayDate,
            },
          });
        } catch {
          // 무시
        }
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[Cron] Completed in ${duration}ms:`, results);

    return NextResponse.json(
      successResponse({
        message: 'Daily content generation completed',
        results,
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
