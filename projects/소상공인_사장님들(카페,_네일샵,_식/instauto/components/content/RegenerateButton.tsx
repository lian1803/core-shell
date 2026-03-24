'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { RefreshCw, Loader2 } from 'lucide-react'
import { useSubscription } from '@/hooks/useSubscription'

interface RegenerateButtonProps {
  contentId: string
  regenerateCount: number
  onRegenerate?: () => void
}

export function RegenerateButton({
  contentId,
  regenerateCount,
  onRegenerate,
}: RegenerateButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { subscription } = useSubscription()
  const { toast } = useToast()

  const limit = subscription?.plan === 'PRO' ? 10 : 3
  const remaining = Math.max(0, limit - regenerateCount)
  const canRegenerate = remaining > 0

  const handleRegenerate = async () => {
    if (!canRegenerate) {
      toast({
        title: '재생성 한도 초과',
        description: '오늘의 재생성 횟수를 모두 사용했습니다',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/content/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId,
          type: 'image', // 기본적으로 이미지 재생성
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || '재생성에 실패했습니다')
      }

      toast({
        title: '재생성 완료',
        description: '새로운 콘텐츠가 생성되었습니다',
      })

      onRegenerate?.()
    } catch (error) {
      toast({
        title: '재생성 실패',
        description: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      onClick={handleRegenerate}
      disabled={!canRegenerate || isLoading}
      className="w-full h-12"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          재생성 중...
        </>
      ) : (
        <>
          <RefreshCw className="mr-2 h-4 w-4" />
          다시 만들기 ({remaining}/{limit})
        </>
      )}
    </Button>
  )
}
