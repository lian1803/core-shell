import type { Metadata } from 'next'
import { Inter, Noto_Sans_SC, Noto_Sans_JP, Noto_Sans_KR } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { locales, type Locale } from '@/i18n'
import { Toaster } from 'sonner'
import './globals.css'

const notoSansKR = Noto_Sans_KR({
  subsets: ['latin'],
  variable: '--font-noto-kr',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const notoSansSC = Noto_Sans_SC({
  subsets: ['latin'],
  variable: '--font-noto-sc',
  display: 'swap',
})

const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  variable: '--font-noto-jp',
  display: 'swap',
})

const fontByLocale: Record<Locale, string> = {
  ko: notoSansKR.variable,
  en: inter.variable,
  zh: notoSansSC.variable,
  ja: notoSansJP.variable,
}

export const metadata: Metadata = {
  title: {
    default: 'Platform — 검증된 마케터 매칭',
    template: '%s | Platform',
  },
  description: '검증된 마케터와 연결하여 비즈니스를 성장시키세요. SNS, 블로그, 광고 등 다양한 마케팅 전문가를 만나보세요.',
  metadataBase: new URL('https://platform-mocha-chi.vercel.app'),
  openGraph: {
    type: 'website',
    siteName: 'Platform',
    locale: 'ko_KR',
    url: 'https://platform-mocha-chi.vercel.app',
    title: 'Platform — 검증된 마케터 매칭',
    description: '검증된 마케터와 연결하여 비즈니스를 성장시키세요. SNS, 블로그, 광고 등 다양한 마케팅 전문가를 만나보세요.',
  },
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  if (!locales.includes(locale as Locale)) notFound()

  setRequestLocale(locale)

  const messages = await getMessages()
  const fontVariable = fontByLocale[locale as Locale]

  return (
    <NextIntlClientProvider messages={messages}>
      <div lang={locale} className={`${fontVariable} bg-background text-text-primary font-sans antialiased min-h-screen`}>
        {children}
        <Toaster richColors position="top-right" />
      </div>
    </NextIntlClientProvider>
  )
}
