'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Region, UserRole } from '@/lib/types/database'

function isValidPassword(pw: string) {
  return pw.length >= 8 && /[a-zA-Z]/.test(pw) && /[0-9]/.test(pw)
}

// ─── In-memory rate limiting ───
const RATE_LIMIT_MAX = 5
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000 // 15 minutes

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(email: string): boolean {
  const now = Date.now()
  const key = email.toLowerCase().trim()
  const entry = rateLimitMap.get(key)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return true
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false
  }

  entry.count++
  return true
}

export async function signUp(data: {
  email: string
  password: string
  name: string
  role: UserRole
  region: Region
  locale: string
}): Promise<{ error: string } | never> {
  if (!checkRateLimit(data.email)) return { error: 'tooManyAttempts' }
  if (data.name.length < 2) return { error: 'nameTooShort' }
  if (!isValidPassword(data.password)) return { error: 'passwordFormat' }

  const supabase = createClient()

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
  })

  if (authError) {
    const code = authError.message?.toLowerCase() ?? ''
    if (
      authError.status === 422 ||
      code.includes('already registered') ||
      code.includes('user_already_exists')
    ) {
      return { error: 'emailExists' }
    }
    if (code.includes('weak_password') || code.includes('weak password')) {
      return { error: 'weakPassword' }
    }
    return { error: 'networkError' }
  }

  if (!authData.user) return { error: 'networkError' }

  // If email is not confirmed (identities empty or email_confirmed_at null), redirect to verify-email
  const needsVerification =
    !authData.user.email_confirmed_at ||
    (authData.user.identities && authData.user.identities.length === 0)

  // users 테이블에 role, name, region 삽입
  const { error: insertError } = await supabase.from('users').insert({
    id: authData.user.id,
    email: data.email,
    role: data.role,
    name: data.name,
    region: data.region,
  })
  if (insertError) return { error: 'networkError' }

  // 마케터인 경우 빈 프로필 생성
  if (data.role === 'marketer') {
    await supabase.from('marketer_profiles').insert({
      user_id: authData.user.id,
      specialties: [],
      region: data.region,
    })
  }

  // event_logs: user_signup
  await supabase.from('event_logs').insert({
    user_id: authData.user.id,
    event_name: 'user_signup',
    event_data: { role: data.role, region: data.region },
  })

  if (needsVerification) {
    redirect(`/${data.locale}/verify-email`)
  }

  const destination = data.role === 'client' ? 'dashboard' : 'feed'
  redirect(`/${data.locale}/${destination}`)
}

export async function signIn(data: {
  email: string
  password: string
  locale: string
}): Promise<{ error: string } | never> {
  if (!checkRateLimit(data.email)) return { error: 'tooManyAttempts' }

  const supabase = createClient()

  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  })

  if (error) {
    const code = error.message?.toLowerCase() ?? ''
    if (
      code.includes('invalid_credentials') ||
      code.includes('invalid login credentials')
    ) {
      return { error: 'invalidCredentials' }
    }
    if (
      code.includes('email_not_confirmed') ||
      code.includes('email not confirmed')
    ) {
      return { error: 'emailNotConfirmed' }
    }
    return { error: 'networkError' }
  }

  if (!authData.user) return { error: 'networkError' }

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', authData.user.id)
    .single()

  const destination = userData?.role === 'marketer' ? 'feed' : 'dashboard'
  redirect(`/${data.locale}/${destination}`)
}

export async function signOut(locale: string) {
  const supabase = createClient()
  await supabase.auth.signOut()
  redirect(`/${locale}`)
}

export async function forgotPassword(data: {
  email: string
  locale: string
}): Promise<{ error?: string; success?: boolean }> {
  const supabase = createClient()

  const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/${data.locale}/reset-password`,
  })

  if (error) {
    return { error: 'networkError' }
  }

  return { success: true }
}

export async function resetPassword(data: {
  password: string
  locale: string
}): Promise<{ error?: string; success?: boolean }> {
  if (!isValidPassword(data.password)) return { error: 'passwordFormat' }

  const supabase = createClient()

  const { error } = await supabase.auth.updateUser({
    password: data.password,
  })

  if (error) {
    return { error: 'networkError' }
  }

  return { success: true }
}
