import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '후기 작성',
  description: '마케터에 대한 후기를 작성해주세요.',
  openGraph: {
    title: '후기 작성 | Platform',
    description: '마케터에 대한 후기를 작성해주세요.',
    type: 'website',
  },
}

export default function ReviewNewLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
