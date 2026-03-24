'use client'

import { usePathname, useRouter } from '@/lib/navigation'
import { useLocale } from 'next-intl'
import type { Locale } from '@/i18n'

const localeLabels: Record<Locale, string> = {
  ko: '한국어',
  en: 'English',
  zh: '中文',
  ja: '日本語',
}

const localeOptions: Locale[] = ['ko', 'en', 'zh', 'ja']

export default function LanguageSwitcher() {
  const locale = useLocale() as Locale
  const router = useRouter()
  const pathname = usePathname()

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const nextLocale = e.target.value as Locale
    router.replace(pathname, { locale: nextLocale })
  }

  return (
    <select
      value={locale}
      onChange={onChange}
      className="h-9 px-2 py-1 rounded-lg border border-border bg-surface text-sm text-text-primary hover:bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-colors cursor-pointer"
      aria-label="Language"
    >
      {localeOptions.map((loc) => (
        <option key={loc} value={loc}>
          {localeLabels[loc]}
        </option>
      ))}
    </select>
  )
}
