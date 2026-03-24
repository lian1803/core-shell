import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getTranslations, setRequestLocale } from 'next-intl/server'

export const metadata: Metadata = {
  title: '의뢰 상세',
  description: '마케팅 의뢰 상세 정보와 받은 제안을 확인하세요.',
  openGraph: {
    title: '의뢰 상세 | Platform',
    description: '마케팅 의뢰 상세 정보와 받은 제안을 확인하세요.',
    type: 'website',
  },
}
import { Link } from '@/lib/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Star, Coins, CalendarDays } from 'lucide-react'
import type { RequestWithProposals, UserRole } from '@/lib/types/database'

export default async function RequestDetailPage({
  params: { id, locale },
}: {
  params: { id: string; locale: string }
}) {
  setRequestLocale(locale)
  const t = await getTranslations('request')
  const tp = await getTranslations('proposal')
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()
  const role = userData?.role as UserRole

  const { data: req } = await supabase
    .from('requests')
    .select('*')
    .eq('id', id)
    .single()

  if (!req) notFound()

  // 마케터가 이미 제안했는지 확인
  let alreadyProposed = false
  if (role === 'marketer') {
    const { data: mp } = await supabase
      .from('marketer_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()
    if (mp) {
      const { data: existing } = await supabase
        .from('proposals')
        .select('id')
        .eq('request_id', id)
        .eq('marketer_id', mp.id)
        .single()
      alreadyProposed = !!existing
    }
  }

  // client만 제안 목록 조회
  const isOwner = req.client_id === user.id
  let proposals: RequestWithProposals['proposals'] = []
  if (isOwner) {
    const { data } = await supabase
      .from('proposals')
      .select(`
        *,
        marketer_profiles (
          *,
          users (name, avatar_url),
          portfolios (*),
          reviews (*)
        )
      `)
      .eq('request_id', id)
      .order('created_at', { ascending: false })
    proposals = (data ?? []) as RequestWithProposals['proposals']
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* 의뢰 요약 */}
      <div className="bg-surface border border-border rounded-xl p-5 mb-6">
        <div className="flex flex-wrap gap-2 mb-2">
          <Badge variant="outline">{req.industry}</Badge>
          <Badge variant={req.status === 'open' ? 'default' : 'outline'}>
            {t(`status.${req.status}` as Parameters<typeof t>[0])}
          </Badge>
        </div>
        <h1 className="text-xl font-bold text-text-primary mb-1">{req.title}</h1>
        <p className="text-sm text-text-secondary mb-3">{req.marketing_type}</p>
        <p className="text-text-primary text-sm leading-relaxed">{req.description}</p>
        <div className="flex flex-wrap gap-4 mt-4 text-xs text-text-secondary">
          {req.budget_min && (
            <span className="flex items-center gap-1">
              <Coins size={13} /> {req.budget_min}~{req.budget_max ?? ''}만원
            </span>
          )}
          {req.expires_at && (
            <span className="flex items-center gap-1">
              <CalendarDays size={13} /> {new Date(req.expires_at).toLocaleDateString()} 마감
            </span>
          )}
        </div>
      </div>

      {/* 마케터: 제안하기 버튼 */}
      {role === 'marketer' && req.status === 'open' && (
        <div className="mb-6">
          {alreadyProposed ? (
            <div className="bg-slate-50 border border-border rounded-xl p-4 text-sm text-text-secondary text-center">
              이미 제안을 보냈습니다
            </div>
          ) : (
            <Link href={`/proposals/new/${id}`}>
              <Button size="lg" className="w-full">{tp('submitBtn')}</Button>
            </Link>
          )}
        </div>
      )}

      {/* client: 받은 제안 목록 */}
      {isOwner && (
        <div>
          <h2 className="text-xl font-bold text-text-primary mb-4">
            받은 제안 <span className="text-primary">{proposals.length}건</span>
          </h2>

          {proposals.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed border-border rounded-xl text-text-secondary">
              <p>{t('noProposals')}</p>
              <p className="text-sm mt-1">{t('noProposalsDesc')}</p>
            </div>
          )}

          <div className="flex flex-col gap-4">
            {proposals.map((p) => (
              <Link key={p.id} href={`/proposals/${p.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {p.marketer_profiles?.users?.name?.[0] ?? 'M'}
                      </div>
                      <div>
                        <p className="font-semibold text-text-primary">{p.marketer_profiles?.users?.name}</p>
                        <div className="flex items-center gap-1">
                          <Star size={12} className="fill-warning text-warning" />
                          <span className="text-xs text-text-secondary">
                            {Number(p.marketer_profiles?.rating_avg ?? 0).toFixed(1)} ({p.marketer_profiles?.review_count ?? 0}개)
                          </span>
                        </div>
                      </div>
                      <div className="ml-auto text-right">
                        <p className="font-bold text-primary text-lg">{p.price}만원</p>
                        {p.duration_days && <p className="text-xs text-text-secondary">{p.duration_days}일 소요</p>}
                      </div>
                    </div>
                    <p className="text-sm text-text-secondary line-clamp-2">{p.content}</p>
                    <Badge
                      variant={p.status === 'accepted' ? 'success' : p.status === 'rejected' ? 'outline' : 'default'}
                      className="mt-3"
                    >
                      {tp(`status.${p.status}` as Parameters<typeof tp>[0])}
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
