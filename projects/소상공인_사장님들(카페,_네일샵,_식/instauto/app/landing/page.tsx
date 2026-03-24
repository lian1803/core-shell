import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Hero } from '@/components/landing/Hero'
import { Features } from '@/components/landing/Features'
import { Pricing } from '@/components/landing/Pricing'

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold text-primary">InstaAuto</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">로그인</Button>
            </Link>
            <Link href="/signup">
              <Button>무료 체험</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Hero />
        <Features />
        <Pricing />
      </main>

      {/* Footer */}
      <footer className="border-t bg-gray-50">
        <div className="container py-8 px-4">
          <div className="text-center text-sm text-muted-foreground">
            <p>© 2026 InstaAuto. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
