'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/lib/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function NewReviewPage({
  params: { proposalId },
}: {
  params: { proposalId: string; locale: string }
}) {
  const t = useTranslations('review')
  const tc = useTranslations('common')
  const router = useRouter()
  const supabase = createClient()

  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (rating === 0) { setError('별점을 선택해주세요'); return }
    if (content.length < 20) { setError('후기는 20자 이상 작성해주세요'); return }

    setSaving(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError(tc('networkError')); setSaving(false); return }

    // 제안 정보 조회
    const { data: proposal } = await supabase
      .from('proposals')
      .select('marketer_id, request_id')
      .eq('id', proposalId)
      .single()

    if (!proposal) { setError(tc('networkError')); setSaving(false); return }

    const { error: insertError } = await supabase.from('reviews').insert({
      proposal_id: proposalId,
      client_id: user.id,
      marketer_id: proposal.marketer_id,
      rating,
      content,
    })

    if (insertError) {
      setError(insertError.message.includes('unique') ? '이미 후기를 작성했습니다' : tc('networkError'))
      setSaving(false)
      return
    }

    // event_logs
    await supabase.from('event_logs').insert({
      user_id: user.id,
      event_name: 'review_created',
      event_data: { proposal_id: proposalId },
    })

    setSuccess(true)
    setTimeout(() => router.push(`/requests/${proposal.request_id}`), 1500)
  }

  return (
    <div className="max-w-lg mx-auto p-6">
      <h1 className="text-2xl font-bold text-text-primary mb-6">{t('newTitle')}</h1>

      {success ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
          <p className="text-accent font-semibold text-lg">✓ {t('successMsg')}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* 별점 */}
          <div className="flex flex-col gap-2">
            <Label>{t('rating')}</Label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  onClick={() => setRating(star)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    size={32}
                    className={cn(
                      'transition-colors',
                      star <= (hovered || rating)
                        ? 'fill-warning text-warning'
                        : 'text-border'
                    )}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-sm text-text-secondary">
                {['', '별로예요', '아쉬워요', '보통이에요', '좋아요', '최고예요!'][rating]}
              </p>
            )}
          </div>

          {/* 후기 내용 */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="content">
              {t('content')}
              <span className="text-text-secondary font-normal ml-2">({content.length}/20자+)</span>
            </Label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t('contentPlaceholder')}
              rows={5}
              className="flex w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">{error}</div>
          )}

          <Button type="submit" size="lg" disabled={saving || rating === 0}>
            {saving ? tc('loading') : t('submitBtn')}
          </Button>
        </form>
      )}
    </div>
  )
}
