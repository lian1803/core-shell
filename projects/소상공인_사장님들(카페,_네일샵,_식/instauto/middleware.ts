// middleware.ts
// Next.js 미들웨어 - 인증 체크 및 리다이렉트

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// 인증 없이 접근 가능한 경로
const PUBLIC_PATHS = [
  '/',
  '/landing',
  '/login',
  '/signup',
  '/api/auth/callback',
  '/api/payment/webhook',
];

// 정적 파일 및 API 제외 패턴
const IGNORED_PATHS = [
  '/_next',
  '/favicon.ico',
  '/images',
  '/fonts',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 정적 파일 무시
  if (IGNORED_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // 공개 경로는 인증 체크 스킵
  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  // Cron Job 인증 (CRON_SECRET)
  if (pathname.startsWith('/api/cron/')) {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error('CRON_SECRET is not set');
      return NextResponse.json(
        { success: false, error: { code: 'CRON_UNAUTHORIZED', message: 'Cron secret not configured' } },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: { code: 'CRON_UNAUTHORIZED', message: 'Invalid cron secret' } },
        { status: 401 }
      );
    }

    return NextResponse.next();
  }

  // Supabase 클라이언트 생성
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables');
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({
          name,
          value,
          ...options,
        });
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        response.cookies.set({
          name,
          value,
          ...options,
        });
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({
          name,
          value: '',
          ...options,
        });
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        response.cookies.set({
          name,
          value: '',
          ...options,
        });
      },
    },
  });

  // 세션 체크
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 비로그인 상태에서 보호된 경로 접근 시
  if (!user) {
    // API 요청은 401 응답
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }
    // 페이지 요청은 로그인 페이지로 리다이렉트
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 로그인 상태에서 로그인/회원가입 페이지 접근 시 홈으로 리다이렉트
  if (user && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
