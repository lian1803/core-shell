import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '대시보드',
  description: '내 마케팅 의뢰 현황을 확인하고 관리하세요.',
  openGraph: {
    title: '대시보드 | Platform',
    description: '내 마케팅 의뢰 현황을 확인하고 관리하세요.',
    type: 'website',
  },
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
