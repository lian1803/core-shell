import { NextResponse, type NextRequest } from 'next/server'

const locales = ['ko', 'en', 'zh', 'ja'] as const
const defaultLocale = 'ko'

function getLocaleFromPath(pathname: string): string {
  for (const locale of locales) {
    if (pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)) {
      return locale
    }
  }
  return defaultLocale
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const locale = getLocaleFromPath(pathname)

  // If no locale prefix, redirect to default locale
  const hasLocale = (locales as readonly string[]).some(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`)
  )
  if (!hasLocale && pathname !== '/') {
    return NextResponse.redirect(new URL(`/${defaultLocale}${pathname}`, request.url))
  }

  // Set locale header for next-intl to read
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('X-NEXT-INTL-LOCALE', locale)

  return NextResponse.next({
    request: { headers: requestHeaders },
  })
}

export const config = {
  matcher: ['/((?!_next|api|favicon.ico|.*\\..*).*)'],
}
