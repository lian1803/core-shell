// app/api/auth/callback/route.ts
// Supabase Auth OAuth 콜백 처리

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/home';

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`);
  }

  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.redirect(`${origin}/login?error=config_error`);
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        cookieStore.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        cookieStore.delete(name);
      },
    },
  });

  try {
    // OAuth 코드를 세션으로 교환
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Auth callback error:', error);
      return NextResponse.redirect(`${origin}/login?error=auth_error`);
    }

    const { user } = data;

    if (!user) {
      return NextResponse.redirect(`${origin}/login?error=no_user`);
    }

    // DB에 유저가 없으면 생성
    const existingUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { shop: true },
    });

    if (!existingUser) {
      // 새 유저 생성
      await prisma.user.create({
        data: {
          id: user.id,
          email: user.email!,
          name: user.user_metadata?.full_name || user.user_metadata?.name || null,
          avatarUrl: user.user_metadata?.avatar_url || null,
        },
      });

      // 온보딩으로 리다이렉트
      return NextResponse.redirect(`${origin}/onboarding/shop`);
    }

    // 기존 유저인데 Shop이 없으면 온보딩으로
    if (!existingUser.shop) {
      return NextResponse.redirect(`${origin}/onboarding/shop`);
    }

    // 기존 유저 + Shop 있으면 원래 목적지로
    return NextResponse.redirect(`${origin}${next}`);
  } catch (error) {
    console.error('Auth callback exception:', error);
    return NextResponse.redirect(`${origin}/login?error=server_error`);
  }
}
