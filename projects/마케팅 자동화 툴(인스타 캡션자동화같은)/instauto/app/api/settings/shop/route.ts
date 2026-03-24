// app/api/settings/shop/route.ts
// GET: 가게 정보 조회
// PATCH: 가게 정보 수정

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/prisma';
import { shopUpdateSchema, ErrorCodes } from '@/types';
import { successResponse, errorResponse } from '@/lib/utils';

// GET: 가게 정보 조회
export async function GET(request: NextRequest) {
  try {
    // 인증 확인
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        errorResponse(ErrorCodes.UNAUTHORIZED, '로그인이 필요합니다'),
        { status: 401 }
      );
    }

    // 가게 정보 조회
    const shop = await prisma.shop.findUnique({
      where: { userId: user.id },
    });

    if (!shop) {
      return NextResponse.json(
        errorResponse(ErrorCodes.NOT_FOUND, '가게 정보가 없습니다'),
        { status: 404 }
      );
    }

    return NextResponse.json(
      successResponse({
        shop: {
          id: shop.id,
          name: shop.name,
          industry: shop.industry,
          vibeKeywords: shop.vibeKeywords,
          representMenus: shop.representMenus,
          igUsername: shop.igUsername,
          createdAt: shop.createdAt.toISOString(),
          updatedAt: shop.updatedAt.toISOString(),
        },
      })
    );
  } catch (error) {
    console.error('Get shop error:', error);
    return NextResponse.json(
      errorResponse(ErrorCodes.INTERNAL_ERROR, '서버 오류가 발생했습니다'),
      { status: 500 }
    );
  }
}

// PATCH: 가게 정보 수정
export async function PATCH(request: NextRequest) {
  try {
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
    const validation = shopUpdateSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      return NextResponse.json(
        errorResponse(ErrorCodes.VALIDATION_ERROR, firstError.message),
        { status: 400 }
      );
    }

    const updateData = validation.data;

    // 기존 가게 확인
    const existingShop = await prisma.shop.findUnique({
      where: { userId: user.id },
    });

    if (!existingShop) {
      return NextResponse.json(
        errorResponse(ErrorCodes.NOT_FOUND, '가게 정보가 없습니다'),
        { status: 404 }
      );
    }

    // 업데이트
    const updatedShop = await prisma.shop.update({
      where: { userId: user.id },
      data: updateData,
    });

    return NextResponse.json(
      successResponse({
        shop: {
          id: updatedShop.id,
          name: updatedShop.name,
          industry: updatedShop.industry,
          vibeKeywords: updatedShop.vibeKeywords,
          representMenus: updatedShop.representMenus,
          updatedAt: updatedShop.updatedAt.toISOString(),
        },
      })
    );
  } catch (error) {
    console.error('Update shop error:', error);
    return NextResponse.json(
      errorResponse(ErrorCodes.INTERNAL_ERROR, '서버 오류가 발생했습니다'),
      { status: 500 }
    );
  }
}
