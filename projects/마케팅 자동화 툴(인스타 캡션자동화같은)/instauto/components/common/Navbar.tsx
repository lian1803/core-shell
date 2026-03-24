'use client'

import Link from 'next/link'
import { Settings } from 'lucide-react'
import { TrialBadge } from './TrialBadge'

export function Navbar() {
  return (
    <nav className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link href="/home" className="flex items-center space-x-2">
          <span className="text-xl font-bold text-primary">InstaAuto</span>
        </Link>

        <div className="flex items-center gap-3">
          <TrialBadge />
          <Link href="/settings">
            <Settings className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
          </Link>
        </div>
      </div>
    </nav>
  )
}
