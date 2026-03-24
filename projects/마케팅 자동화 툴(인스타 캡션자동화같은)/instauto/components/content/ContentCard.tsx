'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { Copy, Download, Instagram, Edit } from 'lucide-react'
import { CaptionEditor } from './CaptionEditor'
import { RegenerateButton } from './RegenerateButton'

interface ContentCardProps {
  content: {
    id: string
    caption: string
    editedCaption?: string | null
    imageUrl: string
    thumbnailUrl?: string | null
    regenerateCount: number
  }
  onUpdate?: () => void
}

export function ContentCard({ content, onUpdate }: ContentCardProps) {
  const [showEditor, setShowEditor] = useState(false)
  const { toast } = useToast()

  const displayCaption = content.editedCaption || content.caption

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(displayCaption)
      toast({
        title: '복사 완료',
        description: '캡션이 클립보드에 복사되었습니다',
      })
    } catch (error) {
      toast({
        title: '복사 실패',
        description: '캡션 복사에 실패했습니다',
        variant: 'destructive',
      })
    }
  }

  const handleDownload = async () => {
    try {
      const response = await fetch(content.imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `instauto-${content.id}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      toast({
        title: '다운로드 완료',
        description: '이미지가 다운로드되었습니다',
      })
    } catch (error) {
      toast({
        title: '다운로드 실패',
        description: '이미지 다운로드에 실패했습니다',
        variant: 'destructive',
      })
    }
  }

  const handleOpenInstagram = () => {
    const instagramUrl = 'instagram://app'
    const webUrl = 'https://www.instagram.com/'

    const link = document.createElement('a')
    link.href = instagramUrl
    link.target = '_blank'

    const timer = setTimeout(() => {
      window.open(webUrl, '_blank')
    }, 1000)

    link.onclick = () => {
      clearTimeout(timer)
    }

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <>
      <Card className="w-full max-w-2xl mx-auto overflow-hidden">
        <CardContent className="p-0">
          {/* 이미지 */}
          <div className="relative w-full aspect-square max-h-[50vh] bg-gray-100">
            <Image
              src={content.thumbnailUrl || content.imageUrl}
              alt="Generated content"
              fill
              className="object-cover"
              priority
            />
          </div>

          {/* 캡션 및 액션 */}
          <div className="p-6 space-y-4">
            {/* 캡션 미리보기 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground">
                  캡션
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEditor(true)}
                  className="h-8"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  수정
                </Button>
              </div>
              <p className="text-sm whitespace-pre-wrap line-clamp-3">
                {displayCaption}
              </p>
            </div>

            {/* 재생성 버튼 */}
            <RegenerateButton
              contentId={content.id}
              regenerateCount={content.regenerateCount}
              onRegenerate={onUpdate}
            />

            {/* 액션 버튼들 */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={handleCopy}
                className="w-full h-12"
              >
                <Copy className="h-4 w-4 mr-2" />
                캡션 복사
              </Button>
              <Button
                variant="outline"
                onClick={handleDownload}
                className="w-full h-12"
              >
                <Download className="h-4 w-4 mr-2" />
                이미지 다운로드
              </Button>
            </div>

            <Button
              onClick={handleOpenInstagram}
              className="w-full h-12"
            >
              <Instagram className="h-4 w-4 mr-2" />
              인스타그램 열기
            </Button>

            {/* Phase 1.1 안내 */}
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
              <p className="text-sm text-blue-800">
                <span className="font-medium">자동 발행 준비 중</span>
                <br />
                곧 인스타그램 자동 발행 기능이 업데이트됩니다
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <CaptionEditor
        open={showEditor}
        onOpenChange={setShowEditor}
        contentId={content.id}
        initialCaption={displayCaption}
        onUpdate={onUpdate}
      />
    </>
  )
}
