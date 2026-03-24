'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Camera } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Specialty } from '@/lib/types/database'

const SPECIALTIES: { value: Specialty; key: string }[] = [
  { value: 'sns', key: 'specialtySns' },
  { value: 'blog', key: 'specialtyBlog' },
  { value: 'place', key: 'specialtyPlace' },
  { value: 'ads', key: 'specialtyAds' },
]

const MAX_AVATAR_SIZE = 2 * 1024 * 1024 // 2MB
const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp']

export default function ProfileEditPage() {
  const t = useTranslations('marketer')
  const tc = useTranslations('common')
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [userName, setUserName] = useState<string>('')
  const [userId, setUserId] = useState<string | null>(null)
  const [specialties, setSpecialties] = useState<Specialty[]>([])
  const [form, setForm] = useState({
    experience_years: '',
    bio: '',
    price_range_min: '',
    price_range_max: '',
  })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setUserId(user.id)

      const [{ data: profileData }, { data: userData }] = await Promise.all([
        supabase
          .from('marketer_profiles')
          .select('specialties, experience_years, bio, price_range_min, price_range_max')
          .eq('user_id', user.id)
          .single(),
        supabase
          .from('users')
          .select('name, avatar_url')
          .eq('id', user.id)
          .single(),
      ])

      if (userData) {
        setUserName(userData.name ?? '')
        setAvatarUrl(userData.avatar_url ?? null)
      }

      if (profileData) {
        setSpecialties(profileData.specialties ?? [])
        setForm({
          experience_years: profileData.experience_years?.toString() ?? '',
          bio: profileData.bio ?? '',
          price_range_min: profileData.price_range_min?.toString() ?? '',
          price_range_max: profileData.price_range_max?.toString() ?? '',
        })
      }
      setLoading(false)
    }
    load()
  }, [])

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !userId) return

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setError('PNG, JPG, WebP 형식만 지원합니다')
      return
    }
    if (file.size > MAX_AVATAR_SIZE) {
      setError('이미지는 2MB 이하만 가능합니다')
      return
    }

    setUploadingAvatar(true)
    setError(null)

    const fileExt = file.name.split('.').pop()
    const filePath = `${userId}/avatar.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true })

    if (uploadError) {
      setError(tc('networkError'))
      setUploadingAvatar(false)
      return
    }

    const { data: publicUrlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    const newUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`

    const { error: updateError } = await supabase
      .from('users')
      .update({ avatar_url: newUrl })
      .eq('id', userId)

    if (updateError) {
      setError(tc('networkError'))
    } else {
      setAvatarUrl(newUrl)
    }
    setUploadingAvatar(false)

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  function toggleSpecialty(s: Specialty) {
    setSpecialties((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    )
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (specialties.length === 0) {
      setError('전문 분야를 1개 이상 선택해주세요')
      return
    }
    if (form.bio.length < 50) {
      setError('소개글은 50자 이상 작성해주세요')
      return
    }

    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error: updateError } = await supabase
      .from('marketer_profiles')
      .update({
        specialties,
        experience_years: form.experience_years ? Number(form.experience_years) : null,
        bio: form.bio,
        price_range_min: form.price_range_min ? Number(form.price_range_min) : null,
        price_range_max: form.price_range_max ? Number(form.price_range_max) : null,
      })
      .eq('user_id', user.id)

    if (updateError) {
      setError(tc('networkError'))
    } else {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="max-w-xl mx-auto p-6 flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-text-primary mb-6">{t('profileEdit')}</h1>

      <form onSubmit={handleSave} className="flex flex-col gap-5">
        {/* 프로필 사진 */}
        <div className="flex flex-col items-center gap-3 mb-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingAvatar}
            className="relative group"
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={userName}
                className="w-20 h-20 rounded-full object-cover border-2 border-border"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center text-primary font-bold text-2xl border-2 border-border">
                {userName?.[0]?.toUpperCase() ?? 'M'}
              </div>
            )}
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera size={20} className="text-white" />
            </div>
            {uploadingAvatar && (
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleAvatarUpload}
          />
          <p className="text-xs text-text-secondary">PNG, JPG, WebP / 2MB</p>
        </div>

        {/* 전문 분야 */}
        <div className="flex flex-col gap-2">
          <Label>{t('specialties')}</Label>
          <div className="flex flex-wrap gap-2">
            {SPECIALTIES.map(({ value, key }) => (
              <button
                key={value}
                type="button"
                onClick={() => toggleSpecialty(value)}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium border-2 transition-all',
                  specialties.includes(value)
                    ? 'border-primary bg-primary text-white'
                    : 'border-border bg-surface text-text-secondary hover:border-primary/50'
                )}
              >
                {t(key as Parameters<typeof t>[0])}
              </button>
            ))}
          </div>
        </div>

        {/* 경력 */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="exp">{t('experienceYears')}</Label>
          <Input
            id="exp"
            type="number"
            min="0"
            max="50"
            value={form.experience_years}
            onChange={(e) => setForm((f) => ({ ...f, experience_years: e.target.value }))}
            placeholder="0"
          />
        </div>

        {/* 소개글 */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="bio">
            {t('bio')}
            <span className="text-text-secondary font-normal ml-2">({form.bio.length}/50자+)</span>
          </Label>
          <textarea
            id="bio"
            value={form.bio}
            onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
            placeholder={t('bioPlaceholder')}
            rows={4}
            className="flex w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
        </div>

        {/* 가격 범위 */}
        <div className="flex gap-3">
          <div className="flex flex-col gap-1.5 flex-1">
            <Label htmlFor="min">{t('priceRangeMin')}</Label>
            <Input
              id="min"
              type="number"
              min="0"
              value={form.price_range_min}
              onChange={(e) => setForm((f) => ({ ...f, price_range_min: e.target.value }))}
              placeholder="30"
            />
          </div>
          <div className="flex flex-col gap-1.5 flex-1">
            <Label htmlFor="max">{t('priceRangeMax')}</Label>
            <Input
              id="max"
              type="number"
              min="0"
              value={form.price_range_max}
              onChange={(e) => setForm((f) => ({ ...f, price_range_max: e.target.value }))}
              placeholder="300"
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">{error}</div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-600">저장되었습니다 ✓</div>
        )}

        <Button type="submit" size="lg" disabled={saving}>
          {saving ? tc('loading') : tc('save')}
        </Button>
      </form>
    </div>
  )
}
