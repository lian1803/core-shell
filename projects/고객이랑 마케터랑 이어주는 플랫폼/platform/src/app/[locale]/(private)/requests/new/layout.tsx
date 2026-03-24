import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '의뢰 등록',
  description: '마케팅 의뢰를 등록하고 검증된 마케터의 제안을 받아보세요.',
  openGraph: {
    title: '의뢰 등록 | Platform',
    description: '마케팅 의뢰를 등록하고 검증된 마케터의 제안을 받아보세요.',
    type: 'website',
  },
}

export default function RequestNewLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
