import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '포트폴리오 등록',
  description: '마케팅 포트폴리오를 등록하여 실력을 보여주세요.',
  openGraph: {
    title: '포트폴리오 등록 | Platform',
    description: '마케팅 포트폴리오를 등록하여 실력을 보여주세요.',
    type: 'website',
  },
}

export default function PortfolioNewLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
