// app/api/history/route.ts
// GET: 유저의 콘텐츠 히스토리 목록

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/prisma';
import { historyQuerySchema, ErrorCodes, PaginatedResponse } from '@/types';
import { errorResponse } from '@/lib/utils';

export async function GET(request: NextRequest) {
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

    // 2. 쿼리 파라미터 파싱
    const { searchParams } = request.nextUrl;
    const queryParams = {
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '10',
      status: searchParams.get('status') || undefined,
    };

    const validation = historyQuerySchema.safeParse(queryParams);

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      return NextResponse.json(
        errorResponse(ErrorCodes.VALIDATION_ERROR, firstError.message),
        { status: 400 }
      );
    }

    const { page, limit, status } = validation.data;

    // 3. 콘텐츠 조회 조건
    const where: {
      userId: string;
      status?: 'GENERATING' | 'READY' | 'PUBLISHED' | 'FAILED';
    } = {
      userId: user.id,
    };

    if (status) {
      where.status = status;
    }

    // 4. 전체 개수 조회
    const total = await prisma.content.count({ where });
    const totalPages = Math.ceil(total / limit);

    // 5. 콘텐츠 목록 조회 (최신순)
    const contents = await prisma.content.findMany({
      where,
      orderBy: { targetDate: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        caption: true,
        editedCaption: true,
        imageUrl: true,
        thumbnailUrl: true,
        status: true,
        targetDate: true,
        publishedAt: true,
        createdAt: true,
      },
    });

    // 6. 응답 데이터 포맷
    const formattedContents = contents.map((content) => ({
      id: content.id,
      caption: content.editedCaption || content.caption,
      imageUrl: content.imageUrl,
      thumbnailUrl: content.thumbnailUrl,
      status: content.status,
      targetDate: content.targetDate.toISOString().split('T')[0],
      publishedAt: content.publishedAt?.toISOString() || null,
      createdAt: content.createdAt.toISOString(),
    }));

    const response: PaginatedResponse<typeof formattedContents[0]> = {
      success: true,
      data: formattedContents,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('History error:', error);
    return NextResponse.json(
      errorResponse(ErrorCodes.INTERNAL_ERROR, '서버 오류가 발생했습니다'),
      { status: 500 }
    );
  }
}
