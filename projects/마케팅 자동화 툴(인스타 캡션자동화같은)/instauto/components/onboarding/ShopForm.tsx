'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, Plus, X } from 'lucide-react'
import { VIBE_KEYWORDS } from '@/types'
import { cn } from '@/lib/utils'

export function ShopForm() {
  const [shopName, setShopName] = useState('')
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([])
  const [menus, setMenus] = useState(['', '', ''])
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const toggleKeyword = (keyword: string) => {
    if (selectedKeywords.includes(keyword)) {
      setSelectedKeywords(selectedKeywords.filter((k) => k !== keyword))
    } else {
      if (selectedKeywords.length < 3) {
        setSelectedKeywords([...selectedKeywords, keyword])
      } else {
        toast({
          title: '최대 3개까지 선택 가능합니다',
          variant: 'destructive',
        })
      }
    }
  }

  const updateMenu = (index: number, value: string) => {
    const newMenus = [...menus]
    newMenus[index] = value
    setMenus(newMenus)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!shopName.trim()) {
      toast({
        title: '가게 이름을 입력해주세요',
        variant: 'destructive',
      })
      return
    }

    if (selectedKeywords.length === 0) {
      toast({
        title: '분위기 키워드를 최소 1개 선택해주세요',
        variant: 'destructive',
      })
      return
    }

    const filteredMenus = menus.filter((m) => m.trim())
    if (filteredMenus.length === 0) {
      toast({
        title: '대표 메뉴를 최소 1개 입력해주세요',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopName: shopName.trim(),
          industry: 'cafe',
          vibeKeywords: selectedKeywords,
          representMenus: filteredMenus,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || '가게 정보 저장에 실패했습니다')
      }

      toast({
        title: '저장 완료',
        description: '가게 정보가 저장되었습니다',
      })

      router.push('/onboarding/instagram')
    } catch (error: any) {
      toast({
        title: '저장 실패',
        description: error.message || '알 수 없는 오류가 발생했습니다',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-2">
        <Label htmlFor="shopName">가게 이름</Label>
        <Input
          id="shopName"
          value={shopName}
          onChange={(e) => setShopName(e.target.value)}
          placeholder="예: 카페 봄날"
          maxLength={50}
          disabled={isLoading}
        />
      </div>

      <div className="space-y-3">
        <Label>분위기 키워드 (최대 3개)</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {VIBE_KEYWORDS.map((keyword) => (
            <Button
              key={keyword}
              type="button"
              variant={selectedKeywords.includes(keyword) ? 'default' : 'outline'}
              className={cn(
                'h-10',
                selectedKeywords.includes(keyword) && 'bg-primary'
              )}
              onClick={() => toggleKeyword(keyword)}
              disabled={isLoading}
            >
              {keyword}
            </Button>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          선택됨: {selectedKeywords.length}/3
        </p>
      </div>

      <div className="space-y-3">
        <Label>대표 메뉴 (최대 3개)</Label>
        {menus.map((menu, index) => (
          <Input
            key={index}
            value={menu}
            onChange={(e) => updateMenu(index, e.target.value)}
            placeholder={`대표 메뉴 ${index + 1}`}
            maxLength={30}
            disabled={isLoading}
          />
        ))}
      </div>

      <Button type="submit" className="w-full h-12" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        다음
      </Button>
    </form>
  )
}
