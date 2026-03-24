'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Instagram } from 'lucide-react'

export default function OnboardingInstagramPage() {
  const router = useRouter()

  const handleSkip = () => {
    router.push('/home')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">인스타그램 연동</h1>
          <p className="text-muted-foreground">
            자동 발행 기능은 곧 제공될 예정입니다
          </p>
        </div>

        <Progress value={100} className="w-full" />

        <Card>
          <CardHeader>
            <CardTitle>인스타그램 연동 (선택)</CardTitle>
            <CardDescription>
              2/2 단계: Phase 1.1에서 자동 발행 기능이 추가됩니다
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-6 text-center space-y-4">
              <Instagram className="h-12 w-12 text-blue-600 mx-auto" />
              <div className="space-y-2">
                <h3 className="font-semibold text-blue-900">
                  자동 발행 기능 준비 중
                </h3>
                <p className="text-sm text-blue-700">
                  현재는 콘텐츠를 복사해서 직접 인스타그램에 올려주세요.
                  <br />
                  곧 자동 발행 기능이 업데이트됩니다!
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleSkip}
                className="w-full h-12"
              >
                시작하기
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                지금 건너뛰고 나중에 설정에서 연동할 수 있습니다
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
