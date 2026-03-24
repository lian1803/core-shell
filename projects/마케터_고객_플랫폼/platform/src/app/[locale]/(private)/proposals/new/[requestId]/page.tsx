'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/lib/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import type { Portfolio } from '@/lib/types/database'

export default function NewProposalPage({
  params: { requestId, locale },
}: {
  params: { requestId: string; locale: string }
}) {
  const t = useTranslations('proposal')
  const tc = useTranslations('common')
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [portfolios, setPortfolios] = useState<Portfolio[]>([])
  const [selectedPortfolios, setSelectedPortfolios] = useState<string[]>([])
  const [isFirstProposal, setIsFirstProposal] = useState(false)

  const [form, setForm] = useState({ price: '', duration_days: '', content: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: mp } = await supabase
        .from('marketer_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!mp) return

      // 중복 제안 확인
      const { data: existing } = await supabase
        .from('proposals')
        .select('id')
        .eq('request_id', requestId)
        .eq('marketer_id', mp.id)
        .single()

      if (existing) {
        setError(t('duplicateError'))
        setLoading(false)
        return
      }

      // 포트폴리오 로드
      const { data: pf } = await supabase.from('portfolios').select('*').eq('marketer_id', mp.id)
      setPortfolios(pf ?? [])

      // 첫 제안 여부 확인
      const { count } = await supabase
        .from('proposals')
        .select('id', { count: 'exact', head: true })
        .eq('marketer_id', mp.id)
      setIsFirstProposal((count ?? 0) === 0)

      setLoading(false)
    }
    load()
  }, [])

  function togglePortfolio(id: string) {
    setSelectedPortfolios((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.content.length < 100) {
      setError('제안 내용은 100자 이상 작성해주세요')
      return
    }
    setSaving(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: mp } = await supabase
      .from('marketer_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()
    if (!mp) { setError(tc('networkError')); setSaving(false); return }

    const { error: insertError } = await supabase.from('proposals').insert({
      request_id: requestId,
      marketer_id: mp.id,
      price: Number(form.price),
      duration_days: form.duration_days ? Number(form.duration_days) : null,
      content: form.content,
      portfolio_ids: selectedPortfolios.length > 0 ? selectedPortfolios : null,
    })

    if (insertError) {
      setError(insertError.message.includes('unique') ? t('duplicateError') : tc('networkError'))
      setSaving(false)
      return
    }

    // event_logs
    const eventName = isFirstProposal ? 'first_proposal_sent' : 'proposal_sent'
    await supabase.from('event_logs').insert({
      user_id: user.id,
      event_name: eventName,
      event_data: { request_id: requestId, marketer_id: mp.id },
    })

    router.push(`/requests/${requestId}`)
  }

  if (loading) {
    return (
      <div className="max-w-xl mx-auto p-6 flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-text-primary mb-6">{t('newTitle')}</h1>

      {error && !saving && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600 mb-4">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="price">{t('price')}</Label>
            <Input
              id="price"
              type="number"
              min="1"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              placeholder="100"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="duration">{t('duration')}</Label>
            <Input
              id="duration"
              type="number"
              min="1"
              value={form.duration_days}
              onChange={(e) => setForm((f) => ({ ...f, duration_days: e.target.value }))}
              placeholder="30"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="content">
            {t('content')}
            <span className="text-text-secondary font-normal ml-2">({form.content.length}/100자+)</span>
          </Label>
          <textarea
            id="content"
            value={form.content}
            onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            placeholder={t('contentPlaceholder')}
            rows={6}
            required
            className="flex w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
        </div>

        {/* 포트폴리오 첨부 */}
        {portfolios.length > 0 && (
          <div className="flex flex-col gap-2">
            <Label>{t('portfolioAttach')}</Label>
            <div className="flex flex-col gap-2">
              {portfolios.map((p) => (
                <label key={p.id} className="flex items-center gap-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-background">
                  <input
                    type="checkbox"
                    checked={selectedPortfolios.includes(p.id)}
                    onChange={() => togglePortfolio(p.id)}
                    className="accent-primary"
                  />
                  <div>
                    <p className="text-sm font-medium text-text-primary">{p.title}</p>
                    {p.result_summary && <p className="text-xs text-accent">{p.result_summary}</p>}
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        <Button type="submit" size="lg" disabled={saving || !form.price}>
          {saving ? tc('loading') : t('submitBtn')}
        </Button>
      </form>
    </div>
  )
}
