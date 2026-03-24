import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { Link } from '@/lib/navigation'
import { Button } from '@/components/ui/button'
import MobileMenu from '@/components/shared/MobileMenu'
import LanguageSwitcher from '@/components/shared/LanguageSwitcher'

export default async function Header({ locale }: { locale: string }) {
  const t = await getTranslations('nav')
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let userRole: string | null = null
  let pendingProposalCount = 0
  if (user) {
    const { data } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()
    userRole = data?.role ?? null

    // For client users, count pending proposals on their requests
    if (userRole === 'client') {
      const { data: requests } = await supabase
        .from('requests')
        .select('id')
        .eq('client_id', user.id)

      if (requests && requests.length > 0) {
        const requestIds = requests.map((r: { id: string }) => r.id)
        const { count } = await supabase
          .from('proposals')
          .select('id', { count: 'exact', head: true })
          .in('request_id', requestIds)
          .eq('status', 'pending')
        pendingProposalCount = count ?? 0
      }
    }
  }

  return (
    <header className="sticky top-0 z-50 glass border-b border-border/40 shadow-header">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-xl font-bold text-primary tracking-tight flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-white text-sm font-bold">P</span>
          </div>
          <span className="hidden sm:inline">Platform</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          <Link href="/marketers" className="px-4 py-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-background/80 transition-all duration-200 text-sm font-medium">
            {t('marketers')}
          </Link>
          {user && userRole === 'client' && (
            <Link href="/dashboard" className="relative px-4 py-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-background/80 transition-all duration-200 text-sm font-medium">
              {t('dashboard')}
              {pendingProposalCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1 leading-none">
                  {pendingProposalCount > 99 ? '99+' : pendingProposalCount}
                </span>
              )}
            </Link>
          )}
          {user && userRole === 'marketer' && (
            <Link href="/feed" className="px-4 py-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-background/80 transition-all duration-200 text-sm font-medium">
              {t('feed')}
            </Link>
          )}
        </nav>

        {/* Auth Buttons - Desktop */}
        <div className="hidden md:flex items-center gap-2">
          <LanguageSwitcher />
          {user ? (
            <form action={`/${locale}/auth/logout`} method="POST">
              <Button variant="ghost" size="sm" type="submit">{t('logout')}</Button>
            </form>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">{t('login')}</Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">{t('signup')}</Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu */}
        <MobileMenu
          locale={locale}
          isLoggedIn={!!user}
          userRole={userRole}
        />
      </div>
    </header>
  )
}
