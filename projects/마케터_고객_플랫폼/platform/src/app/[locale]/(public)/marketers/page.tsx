import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'

export const metadata: Metadata = {
  title: '마케터 둘러보기',
  description: '검증된 마케팅 전문가를 분야별로 둘러보고 비교해보세요. SNS, 블로그, 지역 마케팅, 광고 전문가를 만나보세요.',
  openGraph: {
    title: '마케터 둘러보기 | Platform',
    description: '검증된 마케팅 전문가를 분야별로 둘러보고 비교해보세요.',
    type: 'website',
    url: 'https://platform-mocha-chi.vercel.app/ko/marketers',
  },
}
import { createClient } from '@/lib/supabase/server'
import { Link } from '@/lib/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Star, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import type { MarketerProfileWithUser, Specialty } from '@/lib/types/database'

const specialtyLabel: Record<Specialty, string> = {
  sns: 'SNS', blog: 'Blog/SEO', place: 'Local', ads: 'Ads',
}

const PAGE_SIZE = 12

function escapeLike(str: string): string {
  return str.replace(/[%_\\]/g, (ch) => '\\' + ch)
}

export default async function MarketersPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string }
  searchParams: { specialty?: string; page?: string; q?: string }
}) {
  setRequestLocale(locale)
  const t = await getTranslations('marketer')
  const tm = await getTranslations('marketers')
  const supabase = createClient()

  const currentPage = Math.max(1, parseInt(searchParams.page ?? '1', 10) || 1)
  const from = (currentPage - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1
  const searchQuery = (searchParams.q ?? '').trim()

  let query = supabase
    .from('marketer_profiles')
    .select('*, users(name, avatar_url)', { count: 'exact' })
    .order('rating_avg', { ascending: false })

  if (searchParams.specialty) {
    query = query.contains('specialties', [searchParams.specialty])
  }

  if (searchQuery) {
    const escaped = escapeLike(searchQuery)
    query = query.or(`bio.ilike.%${escaped}%,users.name.ilike.%${escaped}%`)
  }

  query = query.range(from, to)

  const { data: marketers, count } = await query
  const list = (marketers ?? []) as MarketerProfileWithUser[]
  const totalCount = count ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  const SPECIALTY_FILTERS: { value: string; label: string }[] = [
    { value: '', label: '전체' },
    { value: 'sns', label: 'SNS' },
    { value: 'blog', label: 'Blog/SEO' },
    { value: 'place', label: 'Local' },
    { value: 'ads', label: 'Ads' },
  ]

  function buildUrl(params: { specialty?: string; page?: number; q?: string }) {
    const sp = new URLSearchParams()
    const spec = params.specialty ?? searchParams.specialty
    const q = params.q ?? searchQuery
    const page = params.page ?? currentPage
    if (spec) sp.set('specialty', spec)
    if (q) sp.set('q', q)
    if (page > 1) sp.set('page', String(page))
    const qs = sp.toString()
    return `/marketers${qs ? `?${qs}` : ''}`
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 md:py-12">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-text-primary tracking-tight">마케터 둘러보기</h1>
        <p className="text-text-secondary mt-2 text-sm">검증된 전문 마케터를 찾아보세요</p>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col gap-4 mb-8">
        <form method="GET" className="flex gap-2">
          {searchParams.specialty && (
            <input type="hidden" name="specialty" value={searchParams.specialty} />
          )}
          <Input
            name="q"
            placeholder="마케터 이름 또는 소개글 검색..."
            defaultValue={searchQuery}
            className="max-w-sm"
          />
          <Button type="submit" variant="outline" size="default" className="gap-2">
            <Search size={16} />
            검색
          </Button>
        </form>

        <div className="flex gap-2 flex-wrap">
          {SPECIALTY_FILTERS.map(({ value, label }) => (
            <Link
              key={value}
              href={buildUrl({ specialty: value, page: 1 })}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-200 ${
                searchParams.specialty === value || (!searchParams.specialty && !value)
                  ? 'border-primary bg-primary text-white shadow-sm'
                  : 'border-border/60 bg-surface text-text-secondary hover:border-primary/40 hover:text-primary'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* Empty */}
      {list.length === 0 && (
        <div className="text-center py-24 text-text-secondary">
          <div className="w-16 h-16 rounded-2xl bg-background flex items-center justify-center mx-auto mb-4">
            <Search size={28} className="text-text-secondary" />
          </div>
          {searchParams.specialty || searchQuery ? (
            <>
              <p className="text-lg font-medium text-text-primary">{tm('emptyFiltered')}</p>
              <p className="text-sm mt-1.5">{tm('tryOtherFilter')}</p>
            </>
          ) : (
            <>
              <p className="text-lg font-medium text-text-primary">{tm('emptyAll')}</p>
              <p className="text-sm mt-1.5">{tm('emptyAllDesc')}</p>
            </>
          )}
        </div>
      )}

      {/* Grid */}
      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
        {list.map((m) => (
          <Link key={m.id} href={`/marketers/${m.id}`}>
            <Card className="hover:shadow-card-hover hover:-translate-y-1 cursor-pointer h-full">
              <CardContent className="p-5 flex flex-col gap-3.5">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center text-primary font-bold text-lg">
                  {m.users?.name?.[0] ?? 'M'}
                </div>
                <div>
                  <p className="font-semibold text-text-primary tracking-tight">{m.users?.name}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Star size={13} className="fill-warning text-warning" />
                    <span className="text-xs text-text-secondary font-medium">
                      {Number(m.rating_avg).toFixed(1)} ({m.review_count}{t('reviews')})
                    </span>
                  </div>
                </div>
                {m.experience_years && (
                  <p className="text-xs text-text-secondary">경력 {m.experience_years}년</p>
                )}
                <div className="flex flex-wrap gap-1.5">
                  {m.specialties.map((s) => (
                    <Badge key={s} variant="default" className="text-xs">{specialtyLabel[s]}</Badge>
                  ))}
                </div>
                {m.price_range_min && (
                  <p className="text-xs text-text-secondary font-medium mt-auto pt-2 border-t border-border/40">
                    {m.price_range_min}만원~{m.price_range_max ? `${m.price_range_max}만원` : ''}
                  </p>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-10">
          {currentPage > 1 ? (
            <Link href={buildUrl({ page: currentPage - 1 })}>
              <Button variant="outline" size="sm" className="gap-1">
                <ChevronLeft size={16} /> 이전
              </Button>
            </Link>
          ) : (
            <Button variant="outline" size="sm" className="gap-1" disabled>
              <ChevronLeft size={16} /> 이전
            </Button>
          )}
          <span className="text-sm text-text-secondary px-3">
            {currentPage} / {totalPages}
          </span>
          {currentPage < totalPages ? (
            <Link href={buildUrl({ page: currentPage + 1 })}>
              <Button variant="outline" size="sm" className="gap-1">
                다음 <ChevronRight size={16} />
              </Button>
            </Link>
          ) : (
            <Button variant="outline" size="sm" className="gap-1" disabled>
              다음 <ChevronRight size={16} />
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
