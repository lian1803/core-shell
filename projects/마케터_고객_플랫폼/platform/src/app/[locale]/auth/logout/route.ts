import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: { locale: string } }
) {
  // CSRF protection: verify request origin
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')
  const appUrl = new URL(request.url).origin

  if ((!origin || origin !== appUrl) && (!referer || !referer.startsWith(appUrl))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = createClient()
  await supabase.auth.signOut()
  return NextResponse.redirect(new URL(`/${params.locale}`, request.url))
}
