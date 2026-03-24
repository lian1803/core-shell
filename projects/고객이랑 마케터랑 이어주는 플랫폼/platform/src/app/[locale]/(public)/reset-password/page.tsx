'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/lib/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { resetPassword } from '@/app/actions/auth'

export default function ResetPasswordPage({ params: { locale } }: { params: { locale: string } }) {
  const t = useTranslations('auth')
  const tc = useTranslations('common')

  const [form, setForm] = useState({ password: '', confirmPassword: '' })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (form.password !== form.confirmPassword) {
      setError(t('passwordFormat'))
      setLoading(false)
      return
    }

    const result = await resetPassword({ password: form.password, locale })
    if (result.error) {
      setError(t(result.error as Parameters<typeof t>[0]))
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-b from-primary-50/40 to-background px-4 py-12">
      <div className="w-full max-w-sm animate-scale-in opacity-0">
        <div className="bg-surface rounded-2xl border border-border/40 shadow-elevated p-8">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 text-2xl font-bold text-primary">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-white text-sm font-bold">P</span>
              </div>
              Platform
            </Link>
            <p className="text-text-secondary text-sm mt-3">{t('resetPassword')}</p>
          </div>

          {success ? (
            <div className="flex flex-col gap-5">
              <div className="bg-green-50 border border-green-200 rounded-xl p-3.5 text-sm text-green-600">
                {t('resetSuccess')}
              </div>
              <Link href="/login">
                <Button className="w-full">
                  {t('loginBtn')}
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 text-sm text-red-600">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-2">
                <Label htmlFor="password" className="text-sm font-medium text-text-primary">{t('newPassword')}</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••"
                  required
                  autoFocus
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-text-primary">{t('confirmPassword')}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                  placeholder="••••••••"
                  required
                />
              </div>

              <Button type="submit" className="w-full mt-2" size="lg" disabled={loading}>
                {loading ? tc('loading') : t('resetPassword')}
              </Button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-text-secondary mt-6">
          <Link href="/login" className="text-primary hover:underline font-semibold">
            {t('backToLogin')}
          </Link>
        </p>
      </div>
    </div>
  )
}
