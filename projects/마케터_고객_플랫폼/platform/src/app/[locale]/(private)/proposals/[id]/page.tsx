import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getTranslations, setRequestLocale } from 'next-intl/server'

export const metadata: Metadata = {
  title: '제안 상세',
  description: '마케터의 제안 상세 내용과 포트폴리오를 확인하세요.',
  openGraph: {
    title: '제안 상세 | Platform',
    description: '마케터의 제안 상세 내용과 포트폴리오를 확인하세요.',
    type: 'website',
  },
}
import { Link } from '@/lib/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Star, Phone, CalendarDays, Coins } from 'lucide-react'
import AcceptProposalButton from './AcceptProposalButton'
import type { Specialty } from '@/lib/types/database'

const specialtyLabel: Record<Specialty, string> = {
  sns: 'SNS', blog: 'Blog·SEO', place: 'Local', ads: 'Ads',
}

export default async function ProposalDetailPage({
  params: { id, locale },
}: {
  params: { id: string; locale: string }
}) {
  setRequestLocale(locale)
  const t = await getTranslations('proposal')
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  const { data: proposal } = await supabase
    .from('proposals')
    .select(`
      *,
      requests (client_id, title, status),
      marketer_profiles (
        *,
        users (name, avatar_url, phone),
        portfolios (*),
        reviews (rating, content, created_at)
      )
    `)
    .eq('id', id)
    .single()

  if (!proposal) notFound()

  const isOwner = proposal.requests?.client_id === user.id
  const mp = proposal.marketer_profiles

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* 제안 헤더 */}
      <div className="bg-surface border border-border rounded-xl p-5 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl flex-shrink-0">
            {mp?.users?.name?.[0] ?? 'M'}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary">{mp?.users?.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Star size={14} className="fill-warning text-warning" />
              <span className="text-sm text-text-secondary">
                {Number(mp?.rating_avg ?? 0).toFixed(1)} ({mp?.review_count ?? 0}개 후기)
              </span>
              {mp?.experience_years && (
                <span className="text-sm text-text-secondary">· 경력 {mp.experience_years}년</span>
              )}
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {mp?.specialties?.map((s: Specialty) => (
                <Badge key={s} variant="default" className="text-xs">{specialtyLabel[s]}</Badge>
              ))}
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">{proposal.price}만원</p>
            {proposal.duration_days && (
              <p className="text-sm text-text-secondary mt-1 flex items-center gap-1 justify-end">
                <CalendarDays size={13} /> {proposal.duration_days}일
              </p>
            )}
          </div>
        </div>

        {/* 제안 내용 */}
        <div className="mt-5 pt-5 border-t border-border">
          <h2 className="font-semibold text-text-primary mb-2">제안 내용</h2>
          <p className="text-text-primary text-sm leading-relaxed whitespace-pre-wrap">{proposal.content}</p>
        </div>

        {/* 상태 + 연락처 */}
        <div className="mt-4 flex items-center justify-between flex-wrap gap-3">
          <Badge variant={proposal.status === 'accepted' ? 'success' : proposal.status === 'rejected' ? 'outline' : 'default'}>
            {t(`status.${proposal.status}` as Parameters<typeof t>[0])}
          </Badge>

          {proposal.status === 'accepted' && mp?.users?.phone && isOwner && (
            <div className="flex items-center gap-2 text-sm text-accent font-medium">
              <Phone size={14} />
              {mp.users.phone}
            </div>
          )}
        </div>

        {/* 수락 버튼 */}
        {isOwner && proposal.status === 'pending' && proposal.requests?.status === 'open' && (
          <div className="mt-4">
            <AcceptProposalButton proposalId={id} requestId={proposal.request_id} locale={locale} />
          </div>
        )}
      </div>

      {/* 첨부 포트폴리오 */}
      {proposal.portfolio_ids && proposal.portfolio_ids.length > 0 && mp?.portfolios && (
        <section className="mb-6">
          <h2 className="text-lg font-bold text-text-primary mb-3">첨부 포트폴리오</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {mp.portfolios
              .filter((p: { id: string }) => proposal.portfolio_ids?.includes(p.id))
              .map((p: { id: string; image_urls?: string[]; title: string; result_summary?: string; category: string }) => (
                <Card key={p.id} className="overflow-hidden">
                  {p.image_urls?.[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image_urls[0]} alt={p.title} className="w-full h-32 object-cover" />
                  )}
                  <CardContent className="p-3">
                    <p className="font-medium text-sm text-text-primary">{p.title}</p>
                    {p.result_summary && <p className="text-xs text-accent mt-1">📈 {p.result_summary}</p>}
                  </CardContent>
                </Card>
              ))}
          </div>
        </section>
      )}

      {/* 마케터 후기 */}
      {mp?.reviews && mp.reviews.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-text-primary mb-3">마케터 후기</h2>
          <div className="flex flex-col gap-3">
            {mp.reviews.slice(0, 3).map((r: { rating: number; content: string; created_at: string }, i: number) => (
              <div key={i} className="border border-border rounded-xl p-4 bg-surface">
                <div className="flex items-center gap-1 mb-1">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} size={12} className={j < r.rating ? 'fill-warning text-warning' : 'text-border'} />
                  ))}
                </div>
                <p className="text-sm text-text-primary">{r.content}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
