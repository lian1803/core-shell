import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/shared/Sidebar'
import BottomNav from '@/components/shared/BottomNav'
import type { UserRole } from '@/lib/types/database'

export default async function PrivateLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect(`/${locale}/login`)

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = (userData?.role ?? 'client') as UserRole

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar role={role} />
      <main className="flex-1 pb-20 md:pb-0">
        {children}
      </main>
      <BottomNav role={role} />
    </div>
  )
}
