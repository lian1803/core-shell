import { getTranslations } from 'next-intl/server'
import { Link } from '@/lib/navigation'
import { Button } from '@/components/ui/button'
import { FileQuestion } from 'lucide-react'

export default async function NotFound() {
  const t = await getTranslations('errors')

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center flex flex-col items-center gap-6">
        <FileQuestion size={64} className="text-text-secondary" />
        <div>
          <h1 className="text-4xl font-bold text-text-primary">404</h1>
          <h2 className="text-xl font-medium text-text-primary mt-2">{t('notFound')}</h2>
          <p className="text-text-secondary mt-2">{t('notFoundDesc')}</p>
        </div>
        <Link href="/">
          <Button>{t('goHome')}</Button>
        </Link>
      </div>
    </div>
  )
}
