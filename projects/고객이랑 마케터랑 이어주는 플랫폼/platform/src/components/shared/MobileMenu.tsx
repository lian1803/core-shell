'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/lib/navigation'
import { Button } from '@/components/ui/button'
import { Menu, X } from 'lucide-react'

export default function MobileMenu({
  locale,
  isLoggedIn,
  userRole,
}: {
  locale: string
  isLoggedIn: boolean
  userRole: string | null
}) {
  const t = useTranslations('nav')
  const [open, setOpen] = useState(false)

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-lg text-text-secondary hover:bg-background transition-colors"
        aria-label="Toggle menu"
      >
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/20 z-40 animate-fade-in"
            onClick={() => setOpen(false)}
          />

          {/* Panel */}
          <div className="fixed top-16 left-0 right-0 z-50 glass border-b border-border/40 shadow-elevated animate-fade-in-up px-4 pb-6 pt-2">
            <nav className="flex flex-col gap-1">
              <Link
                href="/marketers"
                onClick={() => setOpen(false)}
                className="px-4 py-3 rounded-xl text-text-primary hover:bg-background transition-colors text-sm font-medium"
              >
                {t('marketers')}
              </Link>
              {isLoggedIn && userRole === 'client' && (
                <Link
                  href="/dashboard"
                  onClick={() => setOpen(false)}
                  className="px-4 py-3 rounded-xl text-text-primary hover:bg-background transition-colors text-sm font-medium"
                >
                  {t('dashboard')}
                </Link>
              )}
              {isLoggedIn && userRole === 'marketer' && (
                <Link
                  href="/feed"
                  onClick={() => setOpen(false)}
                  className="px-4 py-3 rounded-xl text-text-primary hover:bg-background transition-colors text-sm font-medium"
                >
                  {t('feed')}
                </Link>
              )}
            </nav>

            <div className="mt-4 pt-4 border-t border-border/40 flex flex-col gap-2">
              {isLoggedIn ? (
                <form action={`/${locale}/auth/logout`} method="POST">
                  <Button variant="outline" className="w-full" type="submit">{t('logout')}</Button>
                </form>
              ) : (
                <>
                  <Link href="/login" onClick={() => setOpen(false)}>
                    <Button variant="outline" className="w-full">{t('login')}</Button>
                  </Link>
                  <Link href="/signup" onClick={() => setOpen(false)}>
                    <Button className="w-full">{t('signup')}</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
