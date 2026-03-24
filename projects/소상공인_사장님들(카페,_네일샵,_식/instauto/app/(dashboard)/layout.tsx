import { Navbar } from '@/components/common/Navbar'
import Link from 'next/link'
import { Home, History, Settings } from 'lucide-react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="flex-1 flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 border-r bg-gray-50/50">
          <nav className="p-4 space-y-2">
            <Link
              href="/home"
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Home className="h-5 w-5" />
              <span>홈</span>
            </Link>
            <Link
              href="/history"
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <History className="h-5 w-5" />
              <span>히스토리</span>
            </Link>
            <Link
              href="/settings"
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Settings className="h-5 w-5" />
              <span>설정</span>
            </Link>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 pb-20 lg:pb-0">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t">
        <div className="flex items-center justify-around h-16">
          <Link
            href="/home"
            className="flex flex-col items-center justify-center flex-1 h-full hover:bg-gray-50"
          >
            <Home className="h-5 w-5" />
            <span className="text-xs mt-1">홈</span>
          </Link>
          <Link
            href="/history"
            className="flex flex-col items-center justify-center flex-1 h-full hover:bg-gray-50"
          >
            <History className="h-5 w-5" />
            <span className="text-xs mt-1">히스토리</span>
          </Link>
          <Link
            href="/settings"
            className="flex flex-col items-center justify-center flex-1 h-full hover:bg-gray-50"
          >
            <Settings className="h-5 w-5" />
            <span className="text-xs mt-1">설정</span>
          </Link>
        </div>
      </nav>
    </div>
  )
}
