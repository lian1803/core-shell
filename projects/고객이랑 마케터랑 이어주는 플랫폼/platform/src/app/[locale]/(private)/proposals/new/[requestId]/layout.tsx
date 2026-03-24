import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '제안 작성',
  description: '마케팅 의뢰에 제안을 작성하고 보내보세요.',
  openGraph: {
    title: '제안 작성 | Platform',
    description: '마케팅 의뢰에 제안을 작성하고 보내보세요.',
    type: 'website',
  },
}

export default function ProposalNewLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
