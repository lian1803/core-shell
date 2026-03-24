'use client'

import Link from 'next/link'

export function Header() {
  return (
    <header className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold text-slate-900">
          📞 연락처 수집기
        </Link>
      </div>
    </header>
  )
}
