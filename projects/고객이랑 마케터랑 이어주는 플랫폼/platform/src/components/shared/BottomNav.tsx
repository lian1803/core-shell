'use client'

import { useTranslations } from 'next-intl'
import { usePathname } from '@/lib/navigation'
import { Link } from '@/lib/navigation'
import { LayoutDashboard, Rss, Users, User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BottomNavProps {
  role: 'client' | 'marketer'
}

export default function BottomNav({ role }: BottomNavProps) {
  const t = useTranslations('nav')
  const pathname = usePathname()

  const clientItems = [
    { href: '/dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { href: '/marketers', label: t('marketers'), icon: Users },
    { href: '/profile/edit', label: t('profile'), icon: User },
  ]

  const marketerItems = [
    { href: '/feed', label: t('feed'), icon: Rss },
    { href: '/marketers', label: t('marketers'), icon: Users },
    { href: '/profile/edit', label: t('profile'), icon: User },
  ]

  const items = role === 'client' ? clientItems : marketerItems

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border/40 md:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-1 px-4 py-2 min-w-[64px] min-h-[44px] text-xs font-medium transition-colors',
                active ? 'text-primary' : 'text-text-secondary'
              )}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 2} />
              <span>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
