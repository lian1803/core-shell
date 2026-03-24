import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/lib/navigation'
import { Button } from '@/components/ui/button'
import { MailCheck } from 'lucide-react'

export default async function VerifyEmailPage({
  params: { locale },
}: {
  params: { locale: string }
}) {
  setRequestLocale(locale)
  const t = await getTranslations('auth')

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-b from-primary-50/40 to-background px-4 py-12">
      <div className="w-full max-w-sm animate-scale-in opacity-0">
        <div className="bg-surface rounded-2xl border border-border/40 shadow-elevated p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center">
              <MailCheck size={32} className="text-primary" />
            </div>
          </div>

          <h1 className="text-xl font-bold text-text-primary tracking-tight mb-3">
            {t('verifyEmailTitle')}
          </h1>

          <p className="text-sm text-text-secondary leading-relaxed mb-8">
            {t('verifyEmailDesc')}
          </p>

          <Link href="/login">
            <Button variant="outline" className="w-full">
              {t('backToLogin')}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
