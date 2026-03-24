import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatAmount(amount: number): string {
  return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(amount)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function getPaymentStatusLabel(status: string): string {
  const map: Record<string, string> = {
    PENDING: '결제 대기',
    PAID: '결제 완료',
    FAILED: '결제 실패',
    CANCELLED: '결제 취소',
  }
  return map[status] || status
}

export function getPaymentStatusColor(status: string): string {
  const map: Record<string, string> = {
    PENDING: 'text-yellow-600 bg-yellow-50',
    PAID: 'text-green-600 bg-green-50',
    FAILED: 'text-red-600 bg-red-50',
    CANCELLED: 'text-gray-600 bg-gray-50',
  }
  return map[status] || 'text-gray-600 bg-gray-50'
}
