import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/lib/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { PlusCircle, MessageSquare, Inbox, ChevronLeft, ChevronRight } from 'lucide-react'
import type { MarketingRequest } from '@/lib/types/database'

const STATUS_VARIANT: Record<string, 'default' | 'success' | 'warning' | 'outline'> = {
  open: 'default',
  in_progress: 'success',
  completed: 'outline',
  closed: 'outline',
}

const PAGE_SIZE = 10

export default async function DashboardPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string }
  searchParams: { status?: string; page?: string }
}) {
  setRequestLocale(locale)
  const t = await getTranslations('request')
  const td = await getTranslations('dashboard')
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()

  // 마케터는 피드로 리다이렉트
  if (userData?.role === 'marketer') redirect(`/${locale}/feed`)

  const currentPage = Math.max(1, parseInt(searchParams.page ?? '1', 10) || 1)
  const from = (currentPage - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let query = supabase
    .from('requests')
    .select('*', { count: 'exact' })
    .eq('client_id', user.id)
    .order('created_at', { ascending: false })

  if (searchParams.status) {
    query = query.eq('status', searchParams.status)
  }

  query = query.range(from, to)

  const { data: requests, count } = await query
  const list = (requests ?? []) as MarketingRequest[]
  const totalCount = count ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  const STATUS_TABS = ['all', 'open', 'in_progress', 'completed', 'closed']

  function buildUrl(params: { status?: string; page?: number }) {
    const sp = new URLSearchParams()
    const status = params.status ?? searchParams.status
    const page = params.page ?? currentPage
    if (status) sp.set('status', status)
    if (page > 1) sp.set('page', String(page))
    const qs = sp.toString()
    return `/dashboard${qs ? `?${qs}` : ''}`
  }

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-text-primary tracking-tight">{t('myRequests')}</h1>
        <Link href="/requests/new">
          <Button size="sm" className="gap-2">
            <PlusCircle size={16} /> {td('newRequest')}
          </Button>
        </Link>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap mb-8">
        {STATUS_TABS.map((s) => (
          <Link
            key={s}
            href={s === 'all' ? '/dashboard' : buildUrl({ status: s, page: 1 })}
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-200 ${
              (s === 'all' && !searchParams.status) || searchParams.status === s
                ? 'border-primary bg-primary text-white shadow-sm'
                : 'border-border/60 bg-surface text-text-secondary hover:border-primary/40 hover:text-primary'
            }`}
          >
            {s === 'all' ? td('all') : t(`status.${s}` as Parameters<typeof t>[0])}
          </Link>
        ))}
      </div>

      {/* Empty */}
      {list.length === 0 && (
        <div className="text-center py-24 border-2 border-dashed border-border/60 rounded-2xl bg-background/50">
          <div className="w-16 h-16 rounded-2xl bg-background flex items-center justify-center mx-auto mb-4">
            <Inbox size={28} className="text-text-secondary" />
          </div>
          <p className="text-text-secondary font-medium">{td('emptyState')}</p>
          <Link href="/requests/new" className="mt-4 inline-block">
            <Button className="mt-2 gap-2"><PlusCircle size={16} /> {td('firstRequest')}</Button>
          </Link>
        </div>
      )}

      {/* Request list */}
      <div className="flex flex-col gap-3">
        {list.map((req) => (
          <Link key={req.id} href={`/requests/${req.id}`}>
            <Card className="hover:shadow-card-hover hover:-translate-y-0.5 cursor-pointer">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={STATUS_VARIANT[req.status]}>
                        {t(`status.${req.status}` as Parameters<typeof t>[0])}
                      </Badge>
                      <span className="text-xs text-text-secondary font-medium">{req.industry}</span>
                    </div>
                    <h3 className="font-semibold text-text-primary mt-2 truncate tracking-tight">{req.title}</h3>
                    <p className="text-sm text-text-secondary mt-1 line-clamp-1">{req.marketing_type}</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-text-secondary flex-shrink-0 bg-background rounded-lg px-2.5 py-1.5">
                    <MessageSquare size={14} />
                    <span className="text-sm font-semibold">{req.proposal_count}</span>
                  </div>
                </div>
                <p className="text-xs text-text-secondary mt-3 pt-3 border-t border-border/40">
                  {td('registered', { date: new Date(req.created_at).toLocaleDateString() })}
                  {req.expires_at && ` · ${td('deadline', { date: new Date(req.expires_at).toLocaleDateString() })}`}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          {currentPage > 1 ? (
            <Link href={buildUrl({ page: currentPage - 1 })}>
              <Button variant="outline" size="sm" className="gap-1">
                <ChevronLeft size={16} /> {td('previous')}
              </Button>
            </Link>
          ) : (
            <Button variant="outline" size="sm" className="gap-1" disabled>
              <ChevronLeft size={16} /> {td('previous')}
            </Button>
          )}
          <span className="text-sm text-text-secondary px-3">
            {currentPage} / {totalPages}
          </span>
          {currentPage < totalPages ? (
            <Link href={buildUrl({ page: currentPage + 1 })}>
              <Button variant="outline" size="sm" className="gap-1">
                {td('next')} <ChevronRight size={16} />
              </Button>
            </Link>
          ) : (
            <Button variant="outline" size="sm" className="gap-1" disabled>
              {td('next')} <ChevronRight size={16} />
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
