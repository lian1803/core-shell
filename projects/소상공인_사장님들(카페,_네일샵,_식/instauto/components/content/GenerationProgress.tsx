'use client'

import { useContentStore } from '@/stores/contentStore'
import { Progress } from '@/components/ui/progress'
import { Loader2 } from 'lucide-react'

export function GenerationProgress() {
  const { generationStatus, progress, streamedCaption } = useContentStore()

  const getMessage = () => {
    switch (generationStatus) {
      case 'generating_caption':
        return '캡션을 작성하고 있어요...'
      case 'generating_image':
        return '이미지를 만들고 있어요...'
      case 'saving':
        return '저장 중...'
      default:
        return '준비 중...'
    }
  }

  if (generationStatus === 'idle' || generationStatus === 'complete') {
    return null
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 p-6">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <div className="text-center space-y-2">
          <p className="text-lg font-medium">{getMessage()}</p>
          <p className="text-sm text-muted-foreground">
            잠시만 기다려주세요
          </p>
        </div>
      </div>

      <Progress value={progress} className="w-full h-2" />

      {generationStatus === 'generating_caption' && streamedCaption && (
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground mb-2">작성 중인 캡션</p>
          <p className="whitespace-pre-wrap text-sm">{streamedCaption}</p>
        </div>
      )}
    </div>
  )
}
