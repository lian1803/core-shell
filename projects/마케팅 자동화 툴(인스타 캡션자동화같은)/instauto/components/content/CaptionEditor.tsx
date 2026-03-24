'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { Loader2 } from 'lucide-react'

interface CaptionEditorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contentId: string
  initialCaption: string
  onUpdate?: () => void
}

export function CaptionEditor({
  open,
  onOpenChange,
  contentId,
  initialCaption,
  onUpdate,
}: CaptionEditorProps) {
  const [caption, setCaption] = useState(initialCaption)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSave = async () => {
    if (caption.length > 2200) {
      toast({
        title: '캡션이 너무 깁니다',
        description: '인스타그램 캡션은 2200자 이내로 작성해주세요',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`/api/content/${contentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ editedCaption: caption }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || '캡션 수정에 실패했습니다')
      }

      toast({
        title: '저장 완료',
        description: '캡션이 수정되었습니다',
      })

      onOpenChange(false)
      onUpdate?.()
    } catch (error) {
      toast({
        title: '저장 실패',
        description: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>캡션 수정</DialogTitle>
          <DialogDescription>
            캡션을 자유롭게 수정하세요. 수정한 내용이 저장됩니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="캡션을 입력하세요..."
            className="min-h-[300px] resize-none"
            maxLength={2200}
          />
          <div className="text-sm text-muted-foreground text-right">
            {caption.length} / 2200
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            취소
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
