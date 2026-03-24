'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/Header'

const PLATFORMS = [
  { id: 'GOOGLE', label: '구글 비즈니스', icon: '🔍' },
  { id: 'NAVER', label: '네이버 블로그', icon: '📝' },
  { id: 'DAANGN', label: '당근마켓', icon: '🥕' },
  { id: 'INSTAGRAM', label: '인스타그램', icon: '📷' },
] as const

export default function NewJobPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    keyword: '',
    region: '',
    limitCount: 100,
    platforms: ['GOOGLE'] as string[],
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (formData.platforms.length === 0) {
      setError('최소 하나의 플랫폼을 선택하세요')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        throw new Error('작업 생성 실패')
      }

      const { job } = await res.json()
      router.push(`/jobs/${job.id}`)
    } catch (err) {
      setError('작업 생성 중 오류가 발생했습니다')
      setLoading(false)
    }
  }

  const togglePlatform = (platformId: string) => {
    setFormData((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(platformId)
        ? prev.platforms.filter((p) => p !== platformId)
        : [...prev.platforms, platformId],
    }))
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">새 수집 작업</h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg p-6 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              키워드 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.keyword}
              onChange={(e) =>
                setFormData({ ...formData, keyword: e.target.value })
              }
              placeholder="예: 강남구 카페, 역삼동 미용실"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              지역 (선택)
            </label>
            <input
              type="text"
              value={formData.region}
              onChange={(e) =>
                setFormData({ ...formData, region: e.target.value })
              }
              placeholder="예: 서울 강남구"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              수집 건수 (최대 500)
            </label>
            <input
              type="number"
              value={formData.limitCount}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  limitCount: Math.min(500, Math.max(1, parseInt(e.target.value) || 100)),
                })
              }
              min={1}
              max={500}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              플랫폼 <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {PLATFORMS.map((platform) => (
                <button
                  key={platform.id}
                  type="button"
                  onClick={() => togglePlatform(platform.id)}
                  className={`flex items-center gap-2 p-3 rounded-md border ${
                    formData.platforms.includes(platform.id)
                      ? 'border-primary bg-primary-50 text-primary'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span>{platform.icon}</span>
                  <span className="text-sm">{platform.label}</span>
                </button>
              ))}
            </div>
            {formData.platforms.includes('INSTAGRAM') && (
              <p className="mt-2 text-xs text-amber-600">
                ⚠️ 인스타그램은 제한적 수집만 가능합니다 (공개 프로필 정보)
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 py-2 border border-slate-300 rounded-md text-slate-600 hover:bg-slate-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading || !formData.keyword}
              className="flex-1 py-2 bg-primary text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? '생성 중...' : '수집 시작'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
