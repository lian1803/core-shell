// app/api/content/[contentId]/route.ts
// GET: 콘텐츠 조회
// PATCH: 캡션 수정

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/prisma';
import { editCaptionSchema, ErrorCodes, PLAN_CONFIG } from '@/types';
import { successResponse, errorResponse, canRegenerate, isValidUUID } from '@/lib/utils';

interface RouteParams {
  params: Promise<{
    contentId: string;
  }>;
}

// GET: 콘텐츠 조회
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { contentId } = await params;

    // UUID 형식 검증
    if (!isValidUUID(contentId)) {
      return NextResponse.json(
        errorResponse(ErrorCodes.VALIDATION_ERROR, '유효하지 않은 콘텐츠 ID입니다'),
        { status: 400 }
      );
    }

    // 인증 확인
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        errorResponse(ErrorCodes.UNAUTHORIZED, '로그인이 필요합니다'),
        { status: 401 }
      );
    }

    // 콘텐츠 조회
    const content = await prisma.content.findUnique({
      where: { id: contentId },
      include: {
        user: {
          include: {
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

    // 본인 콘텐츠인지 확인
    if (content.userId !== user.id) {
      return NextResponse.json(
        errorResponse(ErrorCodes.FORBIDDEN, '접근 권한이 없습니다'),
        { status: 403 }
      );
    }

    // 재생성 정보
    const subscription = content.user.subscription;
    let regenerateInfo = null;

    if (subscription) {
      const regenerateCheck = canRegenerate(
        subscription.plan,
        content.regenerateCount,
        content.lastRegenerateAt
      );
      regenerateInfo = {
        canRegenerate: regenerateCheck.canRegenerate,
        remaining: regenerateCheck.remaining,
        limit: regenerateCheck.limit,
      };
    }

    return NextResponse.json(
      successResponse({
        content: {
          id: content.id,
          caption: content.caption,
          editedCaption: content.editedCaption,
          imageUrl: content.imageUrl,
          thumbnailUrl: content.thumbnailUrl,
          status: content.status,
          targetDate: content.targetDate.toISOString().split('T')[0],
          publishedAt: content.publishedAt?.toISOString() || null,
          createdAt: content.createdAt.toISOString(),
        },
        regenerate: regenerateInfo,
      })
    );
  } catch (error) {
    console.error('Get content error:', error);
    return NextResponse.json(
      errorResponse(ErrorCodes.INTERNAL_ERROR, '서버 오류가 발생했습니다'),
      { status: 500 }
    );
  }
}

// PATCH: 캡션 수정
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { contentId } = await params;

    // UUID 형식 검증
    if (!isValidUUID(contentId)) {
      return NextResponse.json(
        errorResponse(ErrorCodes.VALIDATION_ERROR, '유효하지 않은 콘텐츠 ID입니다'),
        { status: 400 }
      );
    }

    // 인증 확인
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        errorResponse(ErrorCodes.UNAUTHORIZED, '로그인이 필요합니다'),
        { status: 401 }
      );
    }

    // 요청 바디 검증
    const body = await request.json();
    const validation = editCaptionSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      return NextResponse.json(
        errorResponse(ErrorCodes.VALIDATION_ERROR, firstError.message),
        { status: 400 }
      );
    }

    const { editedCaption } = validation.data;

    // 콘텐츠 조회
    const content = await prisma.content.findUnique({
      where: { id: contentId },
    });

    if (!content) {
      return NextResponse.json(
        errorResponse(ErrorCodes.NOT_FOUND, '콘텐츠를 찾을 수 없습니다'),
        { status: 404 }
      );
    }

    // 본인 콘텐츠인지 확인
    if (content.userId !== user.id) {
      return NextResponse.json(
        errorResponse(ErrorCodes.FORBIDDEN, '접근 권한이 없습니다'),
        { status: 403 }
      );
    }

    // 캡션 업데이트
    const updatedContent = await prisma.content.update({
      where: { id: contentId },
      data: { editedCaption },
    });

    return NextResponse.json(
      successResponse({
        content: {
          id: updatedContent.id,
          caption: updatedContent.caption,
          editedCaption: updatedContent.editedCaption,
        },
      })
    );
  } catch (error) {
    console.error('Update caption error:', error);
    return NextResponse.json(
      errorResponse(ErrorCodes.INTERNAL_ERROR, '서버 오류가 발생했습니다'),
      { status: 500 }
    );
  }
}
