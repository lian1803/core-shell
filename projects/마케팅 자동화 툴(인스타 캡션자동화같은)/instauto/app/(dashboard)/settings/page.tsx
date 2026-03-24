'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { useSubscription } from '@/hooks/useSubscription'
import { Loader2, Check } from 'lucide-react'
import { VIBE_KEYWORDS } from '@/types'
import { cn } from '@/lib/utils'

export default function SettingsPage() {
  const { subscription, remainingDays, isExpired, isExpiringSoon, extendTrial } = useSubscription()
  const { toast } = useToast()
  const [reviewUrl, setReviewUrl] = useState('')
  const [isExtending, setIsExtending] = useState(false)

  const handleExtendTrial = async () => {
    if (!reviewUrl.trim()) {
      toast({
        title: '리뷰 URL을 입력해주세요',
        variant: 'destructive',
      })
      return
    }

    setIsExtending(true)
    try {
      await extendTrial(reviewUrl)
      toast({
        title: '체험 기간 연장 완료',
        description: '7일이 추가되었습니다',
      })
      setReviewUrl('')
    } catch (error: any) {
      toast({
        title: '연장 실패',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsExtending(false)
    }
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">설정</h1>

      <Tabs defaultValue="shop" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="shop">가게 정보</TabsTrigger>
          <TabsTrigger value="subscription">구독 관리</TabsTrigger>
        </TabsList>

        <TabsContent value="shop" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>가게 정보</CardTitle>
              <CardDescription>
                가게 정보를 수정하면 다음 콘텐츠부터 반영됩니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>가게 이름</Label>
                <Input placeholder="수정 기능은 백엔드 구현 후 활성화됩니다" disabled />
              </div>
              <div className="space-y-2">
                <Label>분위기 키워드</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {VIBE_KEYWORDS.slice(0, 6).map((keyword) => (
                    <Button key={keyword} variant="outline" disabled>
                      {keyword}
                    </Button>
                  ))}
                </div>
              </div>
              <Button disabled>저장</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscription" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>현재 플랜</CardTitle>
              <CardDescription>
                {subscription?.status === 'TRIAL'
                  ? `무료 체험 ${remainingDays}일 남음`
                  : subscription?.plan === 'BASIC'
                  ? '베이직 플랜'
                  : '프로 플랜'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className={cn(
                  'rounded-lg p-4 border',
                  isExpiringSoon
                    ? 'bg-orange-50 border-orange-200'
                    : isExpired
                    ? 'bg-red-50 border-red-200'
                    : 'bg-blue-50 border-blue-200'
                )}
              >
                <p className="text-sm">
                  {isExpired
                    ? '체험 기간이 종료되었습니다. 플랜을 선택해주세요.'
                    : isExpiringSoon
                    ? `체험 기간이 ${remainingDays}일 남았습니다.`
                    : `${remainingDays}일간 무료로 사용하실 수 있습니다.`}
                </p>
              </div>
            </CardContent>
          </Card>

          {subscription?.status === 'TRIAL' && !subscription.trialExtended && (
            <Card>
              <CardHeader>
                <CardTitle>리뷰 작성하고 7일 연장하기</CardTitle>
                <CardDescription>
                  네이버 플레이스, 카카오맵, 또는 인스타그램 리뷰 URL을 입력해주세요
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reviewUrl">리뷰 URL</Label>
                  <Input
                    id="reviewUrl"
                    type="url"
                    placeholder="https://..."
                    value={reviewUrl}
                    onChange={(e) => setReviewUrl(e.target.value)}
                    disabled={isExtending}
                  />
                </div>
                <Button onClick={handleExtendTrial} disabled={isExtending} className="w-full">
                  {isExtending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  7일 연장하기
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>베이직</CardTitle>
                <CardDescription>19,900원 / 월</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-primary" />
                    매일 AI 콘텐츠 생성
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-primary" />
                    재생성 3회/일
                  </li>
                </ul>
                <Button variant="outline" className="w-full" disabled>
                  업그레이드 (준비 중)
                </Button>
              </CardContent>
            </Card>

            <Card className="border-primary">
              <CardHeader>
                <CardTitle>프로</CardTitle>
                <CardDescription>39,900원 / 월</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-primary" />
                    모든 베이직 기능
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-primary" />
                    재생성 10회/일
                  </li>
                </ul>
                <Button className="w-full" disabled>
                  업그레이드 (준비 중)
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
