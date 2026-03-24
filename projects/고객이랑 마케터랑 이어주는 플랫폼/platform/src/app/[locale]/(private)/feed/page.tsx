import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/lib/navigation'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { CalendarDays, Coins, Tag } from 'lucide-react'
import type { MarketingRequest } from '@/lib/types/database'

export default async function FeedPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string }
  searchParams: { type?: string }
}) {
  setRequestLocale(locale)
  const t = await getTranslations('request')
  const tf = await getTranslations('feed')
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (userData?.role !== 'marketer') redirect(`/${locale}/dashboard`)

  let query = supabase
    .from('requests')
    .select('*')
    .eq('status', 'open')
    .order('created_at', { ascending: false })

  if (searchParams.type) {
    const escapeLike = (s: string) => s.replace(/%/g, '\\%').replace(/_/g, '\\_')
    query = query.ilike('marketing_type', `%${escapeLike(searchParams.type)}%`)
  }

  const { data: requests } = await query
  const list = (requests ?? []) as MarketingRequest[]

  const TYPE_FILTERS = [
    { label: tf('all'), value: '' },
    { label: 'SNS', value: 'sns' },
    { label: 'Blog·SEO', value: 'blog' },
    { label: 'Local', value: 'place' },
    { label: 'Ads', value: 'ads' },
  ]

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-text-primary mb-2">{tf('title')}</h1>
      <p className="text-text-secondary text-sm mb-6">{tf('subtitle')}</p>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap mb-6">
        {TYPE_FILTERS.map(({ label, value }) => (
          <Link
            key={label}
            href={value ? `/feed?type=${value}` : '/feed'}
            className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
              (searchParams.type === value) || (!searchParams.type && !value)
                ? 'border-primary bg-primary text-white'
                : 'border-border bg-surface text-text-secondary hover:border-primary/50'
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Empty */}
      {list.length === 0 && (
        <div className="text-center py-20 text-text-secondary border-2 border-dashed border-border rounded-xl">
          <p>{tf('emptyState')}</p>
          <p className="text-sm mt-1">{tf('emptyStateHint')}</p>
        </div>
      )}

      {/* Request cards */}
      <div className="flex flex-col gap-4">
        {list.map((req) => (
          <Link key={req.id} href={`/requests/${req.id}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-5">
                <div className="flex flex-wrap gap-2 mb-2">
                  <Badge variant="outline">{req.industry}</Badge>
                  {req.marketing_type.split(', ').map((mt) => (
                    <Badge key={mt} variant="default" className="text-xs">{mt.toUpperCase()}</Badge>
                  ))}
                </div>
                <h3 className="font-semibold text-text-primary text-lg mb-1">{req.title}</h3>
                <p className="text-text-secondary text-sm line-clamp-2 mb-3">{req.description}</p>
                <div className="flex flex-wrap gap-4 text-xs text-text-secondary">
                  {req.budget_min && (
                    <span className="flex items-center gap-1">
                      <Coins size={13} />
                      {tf('budgetRange', { min: req.budget_min, max: req.budget_max ?? '' })}
                    </span>
                  )}
                  {req.expires_at && (
                    <span className="flex items-center gap-1">
                      <CalendarDays size={13} />
                      {tf('deadline', { date: new Date(req.expires_at).toLocaleDateString() })}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Tag size={13} />
                    {tf('proposalCount', { count: req.proposal_count })}
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
