import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '회원가입',
  description: 'Platform에 가입하여 검증된 마케터를 만나보세요. 광고주와 마케터 모두 환영합니다.',
  openGraph: {
    title: '회원가입 | Platform',
    description: 'Platform에 가입하여 검증된 마케터를 만나보세요.',
    type: 'website',
    url: 'https://platform-mocha-chi.vercel.app/ko/signup',
  },
}

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
