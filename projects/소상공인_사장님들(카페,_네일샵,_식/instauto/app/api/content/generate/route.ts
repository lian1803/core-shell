// app/api/content/generate/route.ts
// GET: 오늘의 콘텐츠 생성 (SSE 스트리밍)

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/prisma';
import { generateCaption, generateCaptionStream } from '@/lib/openai/generateCaption';
import { generateImage } from '@/lib/openai/generateImage';
import { saveImageToStorage } from '@/lib/storage/saveImage';
import { ErrorCodes, SSEEvent } from '@/types';
import { createSSEMessage, getKSTDateString, checkSubscriptionStatus } from '@/lib/utils';

export const runtime = 'nodejs'; // Prisma, Sharp 사용을 위해 Node.js 런타임 필요
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60초 타임아웃 (DALL-E 이미지 생성 시간 고려)

export async function GET(request: NextRequest) {
  // SSE 스트림 생성
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  // SSE 이벤트 전송 헬퍼
  const sendEvent = async (event: SSEEvent) => {
    await writer.write(encoder.encode(createSSEMessage('message', event)));
  };

  // 비동기로 콘텐츠 생성 처리
  (async () => {
    try {
      // 1. Cron Job 요청인지 확인 (Authorization 헤더에 CRON_SECRET)
      const authHeader = request.headers.get('authorization');
      const cronSecret = process.env.CRON_SECRET;
      const isCronRequest = authHeader === `Bearer ${cronSecret}`;

      let userId: string;
      let userEmail: string;

      if (isCronRequest) {
        // Cron 요청: userId를 쿼리 파라미터에서 가져옴
        const searchParams = request.nextUrl.searchParams;
        const targetUserId = searchParams.get('userId');

        if (!targetUserId) {
          await sendEvent({
            step: 'error',
            message: 'userId 파라미터가 필요합니다',
            error: { code: ErrorCodes.VALIDATION_ERROR, message: 'Missing userId' },
          });
          await writer.close();
          return;
        }

        userId = targetUserId;
        const user = await prisma.user.findUnique({ where: { id: userId } });
        userEmail = user?.email || '';
      } else {
        // 일반 요청: Supabase Auth로 인증
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
          await sendEvent({
            step: 'error',
            message: '로그인이 필요합니다',
            error: { code: ErrorCodes.UNAUTHORIZED, message: 'Authentication required' },
          });
          await writer.close();
          return;
        }

        userId = user.id;
        userEmail = user.email || '';
      }

      // 2. Shop 정보 조회
      const shop = await prisma.shop.findUnique({
        where: { userId },
      });

      if (!shop) {
        await sendEvent({
          step: 'error',
          message: '가게 정보가 없습니다. 온보딩을 먼저 완료해주세요.',
          error: { code: ErrorCodes.NOT_FOUND, message: 'Shop not found' },
        });
        await writer.close();
        return;
      }

      // 3. 구독 상태 확인
      const subscription = await prisma.subscription.findUnique({
        where: { userId },
      });

      if (!subscription) {
        await sendEvent({
          step: 'error',
          message: '구독 정보가 없습니다',
          error: { code: ErrorCodes.SUBSCRIPTION_REQUIRED, message: 'Subscription not found' },
        });
        await writer.close();
        return;
      }

      const subscriptionCheck = checkSubscriptionStatus(
        subscription.status,
        subscription.trialEndAt,
        subscription.currentPeriodEnd
      );

      if (!subscriptionCheck.isActive) {
        await sendEvent({
          step: 'error',
          message: '구독이 만료되었습니다. 플랜을 구독해주세요.',
          error: { code: ErrorCodes.TRIAL_EXPIRED, message: subscriptionCheck.reason || 'Subscription expired' },
        });
        await writer.close();
        return;
      }

      // 4. 오늘의 콘텐츠가 이미 있는지 확인
      const today = getKSTDateString();
      const existingContent = await prisma.content.findUnique({
        where: {
          userId_targetDate: {
            userId,
            targetDate: new Date(today),
          },
        },
      });

      if (existingContent && existingContent.status === 'READY') {
        // 이미 생성된 콘텐츠 반환
        await sendEvent({
          step: 'complete',
          message: '오늘의 콘텐츠가 이미 준비되어 있습니다',
          data: {
            contentId: existingContent.id,
            caption: existingContent.editedCaption || existingContent.caption,
            imageUrl: existingContent.imageUrl,
            thumbnailUrl: existingContent.thumbnailUrl || undefined,
          },
        });
        await writer.close();
        return;
      }

      // 기존에 GENERATING 상태인 콘텐츠가 있으면 삭제
      if (existingContent && existingContent.status === 'GENERATING') {
        await prisma.content.delete({ where: { id: existingContent.id } });
      }

      // 5. 콘텐츠 생성 시작
      await sendEvent({ step: 'start', message: '콘텐츠 생성을 시작합니다' });

      // 6. 콘텐츠 레코드 미리 생성 (GENERATING 상태)
      const contentId = crypto.randomUUID();
      let content = await prisma.content.create({
        data: {
          id: contentId,
          userId,
          caption: '',
          imageUrl: '',
          status: 'GENERATING',
          targetDate: new Date(today),
        },
      });

      // 7. 캡션 생성
      await sendEvent({ step: 'caption_generating', message: '캡션을 생성하고 있습니다...' });

      let captionResult;
      try {
        captionResult = await generateCaption({ shop });
      } catch (error) {
        console.error('Caption generation failed:', error);
        await prisma.content.update({
          where: { id: contentId },
          data: { status: 'FAILED' },
        });
        await sendEvent({
          step: 'error',
          message: '캡션 생성에 실패했습니다',
          error: { code: ErrorCodes.OPENAI_ERROR, message: 'Caption generation failed' },
        });
        await writer.close();
        return;
      }

      await sendEvent({
        step: 'caption_done',
        message: '캡션이 생성되었습니다',
        data: { caption: captionResult.caption },
      });

      // 8. 이미지 생성
      await sendEvent({ step: 'image_generating', message: '이미지를 생성하고 있습니다...' });

      let imageResult;
      try {
        imageResult = await generateImage({ shop });
      } catch (error) {
        console.error('Image generation failed:', error);
        await prisma.content.update({
          where: { id: contentId },
          data: { status: 'FAILED' },
        });
        await sendEvent({
          step: 'error',
          message: '이미지 생성에 실패했습니다',
          error: { code: ErrorCodes.OPENAI_ERROR, message: 'Image generation failed' },
        });
        await writer.close();
        return;
      }

      await sendEvent({ step: 'image_done', message: '이미지가 생성되었습니다' });

      // 9. Storage에 저장
      await sendEvent({ step: 'saving', message: '콘텐츠를 저장하고 있습니다...' });

      let storageResult;
      try {
        storageResult = await saveImageToStorage({
          userId,
          contentId,
          sourceUrl: imageResult.imageUrl,
        });
      } catch (error) {
        console.error('Storage save failed:', error);
        await prisma.content.update({
          where: { id: contentId },
          data: { status: 'FAILED' },
        });
        await sendEvent({
          step: 'error',
          message: '이미지 저장에 실패했습니다',
          error: { code: ErrorCodes.STORAGE_ERROR, message: 'Storage save failed' },
        });
        await writer.close();
        return;
      }

      // 10. DB 업데이트
      content = await prisma.content.update({
        where: { id: contentId },
        data: {
          caption: captionResult.caption,
          imageUrl: storageResult.originalUrl,
          thumbnailUrl: storageResult.thumbnailUrl,
          promptUsed: imageResult.promptUsed,
          captionPromptUsed: captionResult.promptUsed,
          status: 'READY',
        },
      });

      // 11. 완료
      await sendEvent({
        step: 'complete',
        message: '콘텐츠가 준비되었습니다!',
        data: {
          contentId: content.id,
          caption: content.caption,
          imageUrl: content.imageUrl,
          thumbnailUrl: content.thumbnailUrl || undefined,
        },
      });
    } catch (error) {
      console.error('Content generation error:', error);
      await sendEvent({
        step: 'error',
        message: '콘텐츠 생성 중 오류가 발생했습니다',
        error: {
          code: ErrorCodes.INTERNAL_ERROR,
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    } finally {
      await writer.close();
    }
  })();

  // SSE 응답 반환
  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
