'use client'

import { useTranslations } from 'next-intl'
import { usePathname } from '@/lib/navigation'
import { Link } from '@/lib/navigation'
import { LayoutDashboard, Rss, Users, User, PlusCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarProps {
  role: 'client' | 'marketer'
}

export default function Sidebar({ role }: SidebarProps) {
  const t = useTranslations('nav')
  const pathname = usePathname()

  const clientItems = [
    { href: '/dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { href: '/requests/new', label: t('newRequest'), icon: PlusCircle },
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
    <aside className="hidden md:flex flex-col w-60 min-h-screen border-r border-border/40 bg-surface px-4 py-6 gap-1">
      <Link href="/" className="flex items-center gap-2 text-xl font-bold text-primary px-3 mb-8">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <span className="text-white text-sm font-bold">P</span>
        </div>
        Platform
      </Link>
      {items.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
              active
                ? 'bg-primary-50 text-primary'
                : 'text-text-secondary hover:bg-background hover:text-text-primary'
            )}
          >
            <Icon size={18} />
            {label}
          </Link>
        )
      })}
    </aside>
  )
}
