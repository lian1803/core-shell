// app/api/content/regenerate/route.ts
// POST: 콘텐츠 재생성 (이미지 또는 캡션)

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/prisma';
import { regenerateCaption } from '@/lib/openai/generateCaption';
import { regenerateImage } from '@/lib/openai/generateImage';
import { replaceImage } from '@/lib/storage/saveImage';
import { regenerateSchema, ErrorCodes, PLAN_CONFIG } from '@/types';
import { successResponse, errorResponse, canRegenerate } from '@/lib/utils';

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
    const validation = regenerateSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      return NextResponse.json(
        errorResponse(ErrorCodes.VALIDATION_ERROR, firstError.message),
        { status: 400 }
      );
    }

    const { contentId, type } = validation.data;

    // 3. 콘텐츠 조회
    const content = await prisma.content.findUnique({
      where: { id: contentId },
      include: {
        user: {
          include: {
            shop: true,
            subscription: true,
          },
        },
      },
    });

    if (!content) {
      return NextResponse.json(
        errorResponse(ErrorCodes.NOT_FOUND, '콘텐츠를 찾을 수 없습니다'),
        { status: 404 }
      );
    }

    // 4. 본인 콘텐츠인지 확인
    if (content.userId !== user.id) {
      return NextResponse.json(
        errorResponse(ErrorCodes.FORBIDDEN, '접근 권한이 없습니다'),
        { status: 403 }
      );
    }

    // 5. Shop 확인
    const shop = content.user.shop;
    if (!shop) {
      return NextResponse.json(
        errorResponse(ErrorCodes.NOT_FOUND, '가게 정보가 없습니다'),
        { status: 404 }
      );
    }

    // 6. 구독 확인
    const subscription = content.user.subscription;
    if (!subscription) {
      return NextResponse.json(
        errorResponse(ErrorCodes.SUBSCRIPTION_REQUIRED, '구독 정보가 없습니다'),
        { status: 403 }
      );
    }

    // 7. 재생성 횟수 체크
    const regenerateCheck = canRegenerate(
      subscription.plan,
      content.regenerateCount,
      content.lastRegenerateAt
    );

    if (!regenerateCheck.canRegenerate) {
      const limit = PLAN_CONFIG[subscription.plan].regenerateLimit;
      return NextResponse.json(
        errorResponse(
          ErrorCodes.REGENERATE_LIMIT_EXCEEDED,
          `오늘의 재생성 횟수(${limit}회)를 모두 사용했습니다`
        ),
        { status: 429 }
      );
    }

    // 8. 재생성 실행
    const now = new Date();
    let updatedContent;

    if (type === 'caption') {
      // 캡션 재생성
      const captionResult = await regenerateCaption({
        shop,
        previousCaption: content.caption,
      });

      updatedContent = await prisma.content.update({
        where: { id: contentId },
        data: {
          caption: captionResult.caption,
          editedCaption: null, // 수정된 캡션 초기화
          captionPromptUsed: captionResult.promptUsed,
          regenerateCount: {
            increment: 1,
          },
          lastRegenerateAt: now,
        },
      });
    } else {
      // 이미지 재생성
      const imageResult = await regenerateImage({
        shop,
        previousPrompt: content.promptUsed || '',
      });

      // Storage에 새 이미지 저장
      const storageResult = await replaceImage({
        userId: user.id,
        contentId,
        sourceUrl: imageResult.imageUrl,
      });

      updatedContent = await prisma.content.update({
        where: { id: contentId },
        data: {
          imageUrl: storageResult.originalUrl,
          thumbnailUrl: storageResult.thumbnailUrl,
          promptUsed: imageResult.promptUsed,
          regenerateCount: {
            increment: 1,
          },
          lastRegenerateAt: now,
        },
      });
    }

    // 9. 성공 응답
    const newRegenerateCheck = canRegenerate(
      subscription.plan,
      updatedContent.regenerateCount,
      updatedContent.lastRegenerateAt
    );

    return NextResponse.json(
      successResponse({
        content: {
          id: updatedContent.id,
          caption: updatedContent.caption,
          editedCaption: updatedContent.editedCaption,
          imageUrl: updatedContent.imageUrl,
          thumbnailUrl: updatedContent.thumbnailUrl,
        },
        regenerate: {
          remaining: newRegenerateCheck.remaining,
          limit: newRegenerateCheck.limit,
        },
      })
    );
  } catch (error) {
    console.error('Regenerate error:', error);

    // OpenAI 에러
    if (error instanceof Error && error.message.includes('OpenAI')) {
      return NextResponse.json(
        errorResponse(ErrorCodes.OPENAI_ERROR, 'AI 생성에 실패했습니다. 잠시 후 다시 시도해주세요.'),
        { status: 503 }
      );
    }

    return NextResponse.json(
      errorResponse(ErrorCodes.INTERNAL_ERROR, '서버 오류가 발생했습니다'),
      { status: 500 }
    );
  }
}
