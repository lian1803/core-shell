'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/lib/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, X } from 'lucide-react'

const CATEGORIES = ['sns', 'blog', 'place', 'ads', 'etc']

export default function NewPortfolioPage({ params: { locale } }: { params: { locale: string } }) {
  const t = useTranslations('marketer')
  const tc = useTranslations('common')
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    result_summary: '',
    client_industry: '',
  })
  const [images, setImages] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    setImages((prev) => [...prev, ...files].slice(0, 5))
    const urls = files.map((f) => URL.createObjectURL(f))
    setPreviews((prev) => [...prev, ...urls].slice(0, 5))
  }

  function removeImage(i: number) {
    setImages((prev) => prev.filter((_, idx) => idx !== i))
    setPreviews((prev) => prev.filter((_, idx) => idx !== i))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!form.category) { setError('카테고리를 선택해주세요'); return }

    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError(tc('networkError')); setSaving(false); return }

    const { data: mp } = await supabase
      .from('marketer_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!mp) { setError(tc('networkError')); setSaving(false); return }

    // 이미지 업로드
    const imageUrls: string[] = []
    for (const file of images) {
      const ext = file.name.split('.').pop()
      const path = `${user.id}/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('portfolios').upload(path, file)
      if (!upErr) {
        const { data: urlData } = supabase.storage.from('portfolios').getPublicUrl(path)
        imageUrls.push(urlData.publicUrl)
      }
    }

    const { error: insertError } = await supabase.from('portfolios').insert({
      marketer_id: mp.id,
      title: form.title,
      description: form.description || null,
      category: form.category,
      image_urls: imageUrls.length > 0 ? imageUrls : null,
      result_summary: form.result_summary || null,
      client_industry: form.client_industry || null,
    })

    if (insertError) {
      setError(tc('networkError'))
      setSaving(false)
      return
    }

    // event_logs: profile_completed 체크 (포트폴리오 1개 이상 → 완성)
    await supabase.from('event_logs').insert({
      user_id: user.id,
      event_name: 'profile_completed',
      event_data: { marketer_id: mp.id },
    })

    router.push('/profile/edit')
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-text-primary mb-6">{t('portfolioNew')}</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="title">{t('portfolioTitle')}</Label>
          <Input
            id="title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="인스타그램 팔로워 10배 성장 프로젝트"
            required
          />
        </div>

        {/* 카테고리 */}
        <div className="flex flex-col gap-2">
          <Label>{t('portfolioCategory')}</Label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setForm((f) => ({ ...f, category: c }))}
                className={`px-3 py-1.5 rounded-full text-sm border-2 transition-all ${
                  form.category === c ? 'border-primary bg-primary text-white' : 'border-border bg-surface text-text-secondary'
                }`}
              >
                {c.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* 이미지 업로드 */}
        <div className="flex flex-col gap-2">
          <Label>{t('portfolioImages')} (최대 5장)</Label>
          <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
            <Upload size={20} className="text-text-secondary mb-1" />
            <span className="text-sm text-text-secondary">클릭하여 이미지 업로드</span>
            <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} />
          </label>
          {previews.length > 0 && (
            <div className="flex gap-2 flex-wrap mt-1">
              {previews.map((url, i) => (
                <div key={i} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`포트폴리오 이미지 ${i + 1}`} className="w-20 h-20 object-cover rounded-lg" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute -top-1 -right-1 bg-destructive text-white rounded-full p-0.5"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="result">{t('portfolioResult')}</Label>
          <Input
            id="result"
            value={form.result_summary}
            onChange={(e) => setForm((f) => ({ ...f, result_summary: e.target.value }))}
            placeholder={t('portfolioResultPlaceholder')}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="industry">{t('portfolioIndustry')}</Label>
          <Input
            id="industry"
            value={form.client_industry}
            onChange={(e) => setForm((f) => ({ ...f, client_industry: e.target.value }))}
            placeholder="카페, 음식점, 학원..."
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="desc">{t('portfolioDesc')}</Label>
          <textarea
            id="desc"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={3}
            className="flex w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">{error}</div>
        )}

        <Button type="submit" size="lg" disabled={saving}>
          {saving ? tc('loading') : tc('save')}
        </Button>
      </form>
    </div>
  )
}
