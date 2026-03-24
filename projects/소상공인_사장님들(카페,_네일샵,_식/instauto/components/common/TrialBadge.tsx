'use client'

import { useSubscription } from '@/hooks/useSubscription'
import { cn } from '@/lib/utils'

export function TrialBadge() {
  const { subscription, remainingDays, isExpired, isExpiringSoon } = useSubscription()

  if (!subscription || subscription.status !== 'TRIAL') {
    return null
  }

  if (isExpired) {
    return (
      <div className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
        체험 종료
      </div>
    )
  }

  return (
    <div
      className={cn(
        "rounded-full px-3 py-1 text-xs font-medium",
        isExpiringSoon
          ? "bg-orange-100 text-orange-700"
          : "bg-blue-100 text-blue-700"
      )}
    >
      체험 {remainingDays}일 남음
    </div>
  )
}
