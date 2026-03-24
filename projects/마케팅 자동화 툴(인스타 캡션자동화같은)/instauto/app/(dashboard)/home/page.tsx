'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useContent } from '@/hooks/useContent'
import { useContentStore } from '@/stores/contentStore'
import { GenerationProgress } from '@/components/content/GenerationProgress'
import { ContentCard } from '@/components/content/ContentCard'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

export default function HomePage() {
  const { currentContent, isLoading, error, errorCode, fetchTodayContent, startGeneration } = useContent()
  const { generationStatus } = useContentStore()

  useEffect(() => {
    const init = async () => {
      const content = await fetchTodayContent()

      // 콘텐츠가 없으면 자동 생성 시작
      if (!content && generationStatus === 'idle') {
        startGeneration()
      }
    }

    init()
  }, [])

  const handleRefresh = () => {
    fetchTodayContent()
  }

  // 생성 중
  if (generationStatus !== 'idle' && generationStatus !== 'complete') {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8">오늘의 콘텐츠</h1>
        <GenerationProgress />
      </div>
    )
  }

  // 체험 만료 에러 → 결제 유도
  if (errorCode === 'TRIAL_EXPIRED' && !currentContent) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8">오늘의 콘텐츠</h1>
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-8 text-center space-y-4">
          <p className="text-2xl">⏰</p>
          <p className="font-semibold text-yellow-900">무료 체험 기간이 종료되었습니다</p>
          <p className="text-yellow-700 text-sm">구독을 시작하면 계속 AI 콘텐츠를 받을 수 있어요</p>
          <Link href="/settings">
            <Button className="bg-primary hover:bg-primary/90 text-white">
              구독 시작하기 (월 19,900원)
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // 일반 에러
  if (error && !currentContent) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8">오늘의 콘텐츠</h1>
        <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center space-y-4">
          <p className="text-red-800">{error}</p>
          <Button onClick={() => startGeneration()} variant="outline">
            다시 시도
          </Button>
        </div>
      </div>
    )
  }

  // 로딩 중
  if (isLoading && !currentContent) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8">오늘의 콘텐츠</h1>
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">콘텐츠를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  // 콘텐츠 표시
  if (currentContent) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">오늘의 콘텐츠</h1>
          <Button variant="outline" onClick={handleRefresh} size="sm">
            새로고침
          </Button>
        </div>
        <ContentCard content={currentContent} onUpdate={fetchTodayContent} />
      </div>
    )
  }

  // 빈 상태
  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">오늘의 콘텐츠</h1>
      <div className="rounded-lg border bg-card p-8 text-center space-y-4">
        <p className="text-muted-foreground">
          오늘의 콘텐츠가 아직 생성되지 않았습니다
        </p>
        <Button onClick={() => startGeneration()}>
          지금 생성하기
        </Button>
      </div>
    </div>
  )
}
