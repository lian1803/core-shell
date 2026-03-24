import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '의뢰 피드',
  description: '새로운 마케팅 의뢰를 확인하고 제안을 보내보세요.',
  openGraph: {
    title: '의뢰 피드 | Platform',
    description: '새로운 마케팅 의뢰를 확인하고 제안을 보내보세요.',
    type: 'website',
  },
}

export default function FeedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
