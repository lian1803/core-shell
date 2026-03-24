import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'

export async function generateMetadata({
  params: { id },
}: {
  params: { id: string }
}): Promise<Metadata> {
  const supabase = createClient()
  const { data: mp } = await supabase
    .from('marketer_profiles')
    .select('*, users(name)')
    .eq('id', id)
    .single()

  const name = mp?.users?.name ?? '마케터'

  return {
    title: `${name} - 마케터 프로필`,
    description: `${name}의 마케팅 포트폴리오와 후기를 확인하세요. Platform에서 검증된 마케터를 만나보세요.`,
    openGraph: {
      title: `${name} - 마케터 프로필 | Platform`,
      description: `${name}의 마케팅 포트폴리오와 후기를 확인하세요.`,
      type: 'profile',
      url: `https://platform-mocha-chi.vercel.app/ko/marketers/${id}`,
    },
  }
}
import { Link } from '@/lib/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Star, Briefcase, DollarSign, CheckCircle } from 'lucide-react'
import type { Specialty } from '@/lib/types/database'

const specialtyLabel: Record<Specialty, string> = {
  sns: 'SNS', blog: 'Blog/SEO', place: 'Local', ads: 'Ads',
}

export default async function MarketerProfilePage({
  params: { id, locale },
}: {
  params: { id: string; locale: string }
}) {
  setRequestLocale(locale)
  const t = await getTranslations('marketer')
  const supabase = createClient()

  const { data: mp } = await supabase
    .from('marketer_profiles')
    .select('*, users(name, avatar_url)')
    .eq('id', id)
    .single()

  if (!mp) notFound()

  const { data: portfolios } = await supabase
    .from('portfolios')
    .select('*')
    .eq('marketer_id', id)
    .order('created_at', { ascending: false })

  const { data: reviews } = await supabase
    .from('reviews')
    .select('*, users!client_id(name)')
    .eq('marketer_id', id)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-12">
      {/* ─── Profile Header ─── */}
      <Card className="mb-8 overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-primary via-primary-500 to-primary-200" />
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center text-primary font-bold text-3xl flex-shrink-0">
              {mp.users?.name?.[0] ?? 'M'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold text-text-primary tracking-tight">{mp.users?.name}</h1>
                {mp.is_verified && (
                  <Badge variant="success" className="gap-1">
                    <CheckCircle size={12} /> 인증됨
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-text-secondary">
                <span className="flex items-center gap-1.5">
                  <Star size={14} className="fill-warning text-warning" />
                  <span className="font-medium">{Number(mp.rating_avg).toFixed(1)}</span>
                  <span>({mp.review_count}개 후기)</span>
                </span>
                {mp.experience_years && (
                  <span className="flex items-center gap-1.5">
                    <Briefcase size={14} /> 경력 {mp.experience_years}년
                  </span>
                )}
                {mp.price_range_min && (
                  <span className="flex items-center gap-1.5">
                    <DollarSign size={14} /> {mp.price_range_min}~{mp.price_range_max ?? ''}만원
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                {mp.specialties.map((s: Specialty) => (
                  <Badge key={s} variant="default">{specialtyLabel[s]}</Badge>
                ))}
              </div>
              {mp.bio && <p className="text-text-secondary text-sm mt-4 leading-relaxed">{mp.bio}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Portfolio ─── */}
      {portfolios && portfolios.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-bold text-text-primary mb-5 tracking-tight">포트폴리오</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            {portfolios.map((p) => (
              <Card key={p.id} className="overflow-hidden hover:shadow-card-hover transition-all duration-300">
                {p.image_urls?.[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image_urls[0]} alt={p.title} className="w-full h-44 object-cover" />
                )}
                <CardContent className="p-5 flex flex-col gap-2.5">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{p.category.toUpperCase()}</Badge>
                    <h3 className="font-semibold text-text-primary text-sm tracking-tight">{p.title}</h3>
                  </div>
                  {p.result_summary && (
                    <p className="text-sm text-accent font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block" />
                      {p.result_summary}
                    </p>
                  )}
                  {p.client_industry && (
                    <p className="text-xs text-text-secondary">업종: {p.client_industry}</p>
                  )}
                  {p.description && (
                    <p className="text-sm text-text-secondary line-clamp-2 leading-relaxed">{p.description}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* ─── Reviews ─── */}
      <section>
        <h2 className="text-xl font-bold text-text-primary mb-5 tracking-tight">{t('reviews')}</h2>
        {!reviews || reviews.length === 0 ? (
          <div className="text-center py-16 bg-background rounded-2xl">
            <p className="text-text-secondary">{t('noReviews')}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {reviews.map((r) => (
              <Card key={r.id}>
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          className={i < r.rating ? 'fill-warning text-warning' : 'text-border'}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-text-secondary font-medium">
                      {new Date(r.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-text-primary leading-relaxed">{r.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
