import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { Link } from '@/lib/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Star, ArrowRight, CheckCircle, Sparkles, Shield, Zap } from 'lucide-react'
import type { MarketerProfileWithUser } from '@/lib/types/database'

async function getStats() {
  const supabase = createClient()
  const [{ count: marketerCount }, { count: matchCount }, { data: ratings }] = await Promise.all([
    supabase.from('marketer_profiles').select('id', { count: 'exact', head: true }),
    supabase.from('proposals').select('id', { count: 'exact', head: true }).eq('status', 'accepted'),
    supabase.from('marketer_profiles').select('rating_avg').gt('review_count', 0),
  ])
  const avg =
    ratings && ratings.length > 0
      ? (ratings.reduce((s, m) => s + Number(m.rating_avg), 0) / ratings.length).toFixed(1)
      : '0.0'
  return { marketerCount: marketerCount ?? 0, matchCount: matchCount ?? 0, avgRating: avg }
}

async function getFeaturedMarketers() {
  const supabase = createClient()
  const { data } = await supabase
    .from('marketer_profiles')
    .select('*, users(name, avatar_url)')
    .order('rating_avg', { ascending: false })
    .gt('review_count', 0)
    .limit(4)
  return (data ?? []) as MarketerProfileWithUser[]
}

export const metadata: Metadata = {
  title: 'Platform — 검증된 마케터 매칭',
  description: '검증된 마케터와 연결하여 비즈니스를 성장시키세요. SNS, 블로그, 광고 등 다양한 마케팅 전문가를 만나보세요.',
  openGraph: {
    title: 'Platform — 검증된 마케터 매칭',
    description: '검증된 마케터와 연결하여 비즈니스를 성장시키세요.',
    type: 'website',
    url: 'https://platform-mocha-chi.vercel.app',
  },
}

const specialtyLabel: Record<string, string> = {
  sns: 'SNS',
  blog: 'Blog/SEO',
  place: 'Local',
  ads: 'Ads',
}

export default async function LandingPage({
  params: { locale },
}: {
  params: { locale: string }
}) {
  setRequestLocale(locale)
  const t = await getTranslations('landing')
  const tc = await getTranslations('common')

  const [stats, featuredMarketers] = await Promise.all([getStats(), getFeaturedMarketers()])

  return (
    <div className="flex flex-col">
      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden px-4 sm:px-6 pt-16 pb-20 md:pt-28 md:pb-36">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-blue-50/40" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/[0.03] rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/[0.04] rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />

        <div className="relative max-w-3xl mx-auto flex flex-col items-center gap-6 text-center">
          {/* Trust badge */}
          <div className="animate-fade-in-up inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 border border-primary-100 text-primary text-sm font-medium">
            <Sparkles size={14} />
            <span>{locale === 'ko' ? '검증된 마케터와 함께' : 'With Verified Marketers'}</span>
          </div>

          <h1 className="animate-fade-in-up delay-100 text-[clamp(2rem,6vw,3.25rem)] font-bold text-text-primary leading-[1.15] tracking-tight">
            {t('heroTitle')}
          </h1>

          <p className="animate-fade-in-up delay-200 text-text-secondary text-lg md:text-xl leading-relaxed max-w-xl">
            {t('heroSubtitle')}
          </p>

          <div className="animate-fade-in-up delay-300 flex flex-col sm:flex-row gap-3 mt-4">
            <Link href="/signup?role=client">
              <Button size="xl" className="w-full sm:w-auto gap-2 text-[15px]">
                {t('ctaClient')} <ArrowRight size={18} />
              </Button>
            </Link>
            <Link href="/signup?role=marketer">
              <Button variant="outline" size="xl" className="w-full sm:w-auto text-[15px]">
                {t('ctaMarketer')}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Stats ─── */}
      <section className="relative -mt-8 px-4 sm:px-6 z-10">
        <div className="max-w-3xl mx-auto">
          <div className="bg-surface rounded-2xl shadow-elevated border border-border/40 grid grid-cols-3 divide-x divide-border/50">
            <div className="px-4 sm:px-8 py-6 sm:py-8 text-center animate-count-up">
              <p className="text-2xl sm:text-4xl font-bold text-primary tracking-tight">{stats.marketerCount}+</p>
              <p className="text-xs sm:text-sm text-text-secondary mt-1.5 font-medium">{t('statsMarketers')}</p>
            </div>
            <div className="px-4 sm:px-8 py-6 sm:py-8 text-center animate-count-up delay-100">
              <p className="text-2xl sm:text-4xl font-bold text-primary tracking-tight">{stats.matchCount}+</p>
              <p className="text-xs sm:text-sm text-text-secondary mt-1.5 font-medium">{t('statsMatches')}</p>
            </div>
            <div className="px-4 sm:px-8 py-6 sm:py-8 text-center animate-count-up delay-200">
              <div className="flex items-center justify-center gap-1.5">
                <Star size={20} className="fill-warning text-warning" />
                <p className="text-2xl sm:text-4xl font-bold text-primary tracking-tight">{stats.avgRating}</p>
              </div>
              <p className="text-xs sm:text-sm text-text-secondary mt-1.5 font-medium">{t('statsRating')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="py-20 md:py-28 px-4 sm:px-6 bg-background">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-primary font-semibold text-sm mb-3 tracking-wide uppercase">How it works</p>
            <h2 className="text-2xl md:text-3xl font-bold text-text-primary tracking-tight">
              {t('howTitle')}
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 md:gap-10">
            {[
              { step: '01', title: t('how1Title'), desc: t('how1Desc'), icon: Sparkles, delay: '' },
              { step: '02', title: t('how2Title'), desc: t('how2Desc'), icon: Shield, delay: 'delay-100' },
              { step: '03', title: t('how3Title'), desc: t('how3Desc'), icon: Zap, delay: 'delay-200' },
            ].map(({ step, title, desc, icon: Icon, delay }) => (
              <div key={step} className={`animate-fade-in-up ${delay} flex flex-col items-center text-center gap-5 p-6 rounded-2xl hover:bg-surface hover:shadow-card transition-all duration-300`}>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center">
                  <Icon size={28} className="text-primary" />
                </div>
                <div>
                  <p className="text-xs text-primary font-bold mb-2 tracking-widest">{step}</p>
                  <h3 className="font-bold text-text-primary text-lg mb-2 tracking-tight">{title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Featured Marketers ─── */}
      {featuredMarketers.length > 0 && (
        <section className="py-20 md:py-28 px-4 sm:px-6 bg-gradient-to-b from-background to-primary-50/30">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-primary font-semibold text-sm mb-2 tracking-wide">Top Marketers</p>
                <h2 className="text-2xl md:text-3xl font-bold text-text-primary tracking-tight">{t('featuredMarketers')}</h2>
              </div>
              <Link href="/marketers" className="hidden sm:block">
                <Button variant="outline" size="sm" className="gap-2">
                  {tc('search')} <ArrowRight size={14} />
                </Button>
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
              {featuredMarketers.map((m, idx) => (
                <Link key={m.id} href={`/marketers/${m.id}`}>
                  <Card className={`hover:shadow-card-hover hover:-translate-y-1 cursor-pointer h-full animate-fade-in-up ${idx === 0 ? '' : idx === 1 ? 'delay-100' : idx === 2 ? 'delay-200' : 'delay-300'}`}>
                    <CardContent className="p-5 flex flex-col gap-3.5">
                      {/* Avatar */}
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center text-primary font-bold text-lg">
                        {m.users?.name?.[0] ?? 'M'}
                      </div>
                      <div>
                        <p className="font-semibold text-text-primary tracking-tight">{m.users?.name}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Star size={13} className="fill-warning text-warning" />
                          <span className="text-xs text-text-secondary font-medium">
                            {Number(m.rating_avg).toFixed(1)} ({m.review_count})
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {m.specialties.slice(0, 2).map((s) => (
                          <Badge key={s} variant="default" className="text-xs">
                            {specialtyLabel[s] ?? s}
                          </Badge>
                        ))}
                      </div>
                      {m.price_range_min && (
                        <p className="text-xs text-text-secondary font-medium">
                          {locale === 'en' ? `From $${m.price_range_min}` : `${m.price_range_min}만원~`}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
            <div className="mt-8 text-center sm:hidden">
              <Link href="/marketers">
                <Button variant="outline" className="gap-2">{tc('search')} <ArrowRight size={16} /></Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ─── CTA Repeat ─── */}
      <section className="relative overflow-hidden py-24 md:py-32 px-4 sm:px-6 text-center">
        {/* Rich gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-700 to-primary-800" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />

        <div className="relative max-w-2xl mx-auto flex flex-col items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center mb-2">
            <CheckCircle size={32} className="text-white" />
          </div>
          <h2 className="text-2xl md:text-4xl font-bold text-white tracking-tight leading-tight">{t('heroTitle')}</h2>
          <p className="text-white/70 text-lg max-w-lg">{t('heroSubtitle')}</p>
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <Link href="/signup?role=client">
              <Button size="xl" className="bg-white text-primary hover:bg-white/90 shadow-lg w-full sm:w-auto text-[15px]">
                {t('ctaClient')}
              </Button>
            </Link>
            <Link href="/signup?role=marketer">
              <Button size="xl" variant="outline" className="border-white/40 text-white hover:bg-white/15 hover:border-white/60 w-full sm:w-auto text-[15px] bg-white/10">
                {t('ctaMarketer')}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="py-8 px-4 sm:px-6 bg-surface border-t border-border/40">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-text-secondary">
          <p className="font-medium">&copy; {new Date().getFullYear()} Platform. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/marketers" className="hover:text-text-primary transition-colors">{locale === 'ko' ? '마케터 찾기' : 'Find Marketers'}</Link>
            <Link href="/login" className="hover:text-text-primary transition-colors">{locale === 'ko' ? '로그인' : 'Log in'}</Link>
            <Link href="/terms" className="hover:text-text-primary transition-colors">{tc('terms')}</Link>
            <Link href="/privacy" className="hover:text-text-primary transition-colors">{tc('privacy')}</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
