'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { api } from '@/lib/api'

declare global {
  interface Window {
    TossPayments: any
  }
}

export default function TossPaymentPage() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId') || ''
  const amount = parseInt(searchParams.get('amount') || '0')
  const orderName = searchParams.get('orderName') || ''

  useEffect(() => {
    if (!orderId || !amount) return

    const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY
    if (!clientKey) {
      alert('토스페이먼츠 설정이 필요합니다.')
      return
    }

    // 토스페이먼츠 SDK 동적 로드
    const script = document.createElement('script')
    script.src = 'https://js.tosspayments.com/v1/payment'
    script.onload = () => {
      const tossPayments = window.TossPayments(clientKey)
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

      tossPayments.requestPayment('카드', {
        amount,
        orderId,
        orderName,
        customerName: '고객',
        successUrl: `${apiUrl}/payment-callback/toss/confirm-redirect?orderId=${orderId}&amount=${amount}`,
        failUrl: `${window.location.origin}/payment/done?status=failed`,
      }).catch((err: any) => {
        if (err.code !== 'USER_CANCEL') {
          console.error('Toss payment error:', err)
        }
        window.location.href = `/payment/done?status=cancelled`
      })
    }
    document.head.appendChild(script)
  }, [orderId, amount])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600">토스페이먼츠 결제창 준비 중...</p>
      </div>
    </div>
  )
}
