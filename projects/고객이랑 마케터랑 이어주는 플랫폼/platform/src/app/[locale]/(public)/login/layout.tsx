import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '로그인',
  description: 'Platform에 로그인하여 마케터 매칭 서비스를 이용하세요.',
  openGraph: {
    title: '로그인 | Platform',
    description: 'Platform에 로그인하여 마케터 매칭 서비스를 이용하세요.',
    type: 'website',
    url: 'https://platform-mocha-chi.vercel.app/ko/login',
  },
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
