'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { Calendar, Copy, Download } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Content {
  id: string
  caption: string
  editedCaption?: string | null
  imageUrl: string
  thumbnailUrl?: string | null
  targetDate: string
  status: string
  createdAt: string
}

export function HistoryList() {
  const [contents, setContents] = useState<Content[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchHistory()
  }, [page])

  const fetchHistory = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/history?page=${page}&limit=10`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || '히스토리를 불러오는데 실패했습니다')
      }

      if (page === 1) {
        setContents(data.data || [])
      } else {
        setContents((prev) => [...prev, ...(data.data || [])])
      }

      setHasMore(data.pagination?.page < data.pagination?.totalPages)
    } catch (error: any) {
      toast({
        title: '불러오기 실패',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = async (content: Content) => {
    try {
      await navigator.clipboard.writeText(content.editedCaption || content.caption)
      toast({
        title: '복사 완료',
        description: '캡션이 클립보드에 복사되었습니다',
      })
    } catch (error) {
      toast({
        title: '복사 실패',
        variant: 'destructive',
      })
    }
  }

  const handleDownload = async (content: Content) => {
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
      })
    } catch (error) {
      toast({
        title: '다운로드 실패',
        variant: 'destructive',
      })
    }
  }

  if (contents.length === 0 && !isLoading) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        아직 생성된 콘텐츠가 없습니다
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {contents.map((content) => (
          <Card key={content.id} className="overflow-hidden">
            <div className="relative aspect-square bg-gray-100">
              <Image
                src={content.thumbnailUrl || content.imageUrl}
                alt="Content"
                fill
                className="object-cover"
              />
              <div
                className={cn(
                  'absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium',
                  content.status === 'PUBLISHED'
                    ? 'bg-green-100 text-green-700'
                    : content.status === 'READY'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700'
                )}
              >
                {content.status === 'PUBLISHED' ? '발행됨' : content.status === 'READY' ? '준비됨' : '생성 중'}
              </div>
            </div>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="h-4 w-4 mr-2" />
                {new Date(content.targetDate).toLocaleDateString('ko-KR')}
              </div>
              <p className="text-sm line-clamp-2">
                {content.editedCaption || content.caption}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(content)}
                  className="flex-1"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(content)}
                  className="flex-1"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => setPage((p) => p + 1)}
            disabled={isLoading}
          >
            {isLoading ? '로딩 중...' : '더 보기'}
          </Button>
        </div>
      )}
    </div>
  )
}
