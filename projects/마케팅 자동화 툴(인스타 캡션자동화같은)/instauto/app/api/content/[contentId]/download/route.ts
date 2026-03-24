// app/api/content/[contentId]/download/route.ts
// POST: 콘텐츠 다운로드 완료 처리 (PUBLISHED 상태로 전환)

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/prisma';
import { ErrorCodes } from '@/types';
import { successResponse, errorResponse, isValidUUID } from '@/lib/utils';
import { getSignedDownloadUrl } from '@/lib/storage/saveImage';

interface RouteParams {
  params: Promise<{
    contentId: string;
  }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
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

    // READY 상태가 아니면 다운로드 불가
    if (content.status !== 'READY' && content.status !== 'PUBLISHED') {
      return NextResponse.json(
        errorResponse(ErrorCodes.CONFLICT, '다운로드할 수 없는 상태입니다'),
        { status: 409 }
      );
    }

    // 서명된 다운로드 URL 생성
    const downloadUrl = await getSignedDownloadUrl(user.id, contentId);

    if (!downloadUrl) {
      return NextResponse.json(
        errorResponse(ErrorCodes.STORAGE_ERROR, '다운로드 URL 생성에 실패했습니다'),
        { status: 500 }
      );
    }

    // PUBLISHED 상태로 업데이트 (아직 READY인 경우)
    const now = new Date();
    let updatedContent = content;

    if (content.status === 'READY') {
      updatedContent = await prisma.content.update({
        where: { id: contentId },
        data: {
          status: 'PUBLISHED',
          publishedAt: now,
        },
      });
    }

    return NextResponse.json(
      successResponse({
        downloadUrl,
        content: {
          id: updatedContent.id,
          status: updatedContent.status,
          publishedAt: updatedContent.publishedAt?.toISOString() || null,
        },
      })
    );
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      errorResponse(ErrorCodes.INTERNAL_ERROR, '서버 오류가 발생했습니다'),
      { status: 500 }
    );
  }
}
