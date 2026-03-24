import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '프로필 수정',
  description: '마케터 프로필을 수정하여 더 많은 고객을 만나보세요.',
  openGraph: {
    title: '프로필 수정 | Platform',
    description: '마케터 프로필을 수정하여 더 많은 고객을 만나보세요.',
    type: 'website',
  },
}

export default function ProfileEditLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
