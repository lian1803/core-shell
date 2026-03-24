'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function createRequest(data: {
  title: string
  industry: string
  marketing_types: string[]
  budget: string
  description: string
  locale: string
}): Promise<{ error: string }> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'notAuthenticated' }

  // Validate required fields
  if (!data.title.trim()) return { error: 'missingTitle' }
  if (!data.industry) return { error: 'missingIndustry' }
  if (data.marketing_types.length === 0) return { error: 'missingMarketingType' }
  if (!data.budget) return { error: 'missingBudget' }
  if (!data.description.trim()) return { error: 'missingDescription' }

  const { data: userData } = await supabase
    .from('users')
    .select('region')
    .eq('id', user.id)
    .single()

  if (!userData) return { error: 'networkError' }

  const [budgetMin, budgetMax] = data.budget.split('-').map(Number)

  const { data: inserted, error: insertError } = await supabase
    .from('requests')
    .insert({
      client_id: user.id,
      title: data.title.trim(),
      industry: data.industry,
      marketing_type: data.marketing_types.join(', '),
      budget_min: budgetMin,
      budget_max: budgetMax === 999 ? null : budgetMax,
      description: data.description.trim(),
      region: userData.region,
    })
    .select('id')
    .single()

  if (insertError || !inserted) return { error: 'networkError' }

  // event_logs: request_created
  await supabase.from('event_logs').insert({
    user_id: user.id,
    event_name: 'request_created',
    event_data: { request_id: inserted.id },
  })

  redirect(`/${data.locale}/requests/${inserted.id}`)
}
