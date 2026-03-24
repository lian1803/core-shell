import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { ShopForm } from '@/components/onboarding/ShopForm'

export default function OnboardingShopPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">가게 정보를 알려주세요</h1>
          <p className="text-muted-foreground">
            AI가 가게 분위기에 맞는 콘텐츠를 만들어드려요
          </p>
        </div>

        <Progress value={50} className="w-full" />

        <Card>
          <CardHeader>
            <CardTitle>기본 정보</CardTitle>
            <CardDescription>
              1/2 단계: 가게 이름과 분위기를 선택해주세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ShopForm />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
