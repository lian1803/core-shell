'use client'

import { useSearchParams } from 'next/navigation'

const STATUS_MAP: Record<string, { emoji: string; title: string; desc: string; color: string }> = {
  paid: { emoji: '✅', title: '결제 완료!', desc: '결제가 성공적으로 완료되었습니다.', color: 'text-green-600' },
  already_paid: { emoji: '✅', title: '이미 완료된 결제', desc: '결제가 이미 완료된 상태입니다.', color: 'text-green-600' },
  cancelled: { emoji: '↩️', title: '결제 취소', desc: '결제가 취소되었습니다.', color: 'text-gray-600' },
  failed: { emoji: '❌', title: '결제 실패', desc: '결제 처리 중 오류가 발생했습니다. 다시 시도해주세요.', color: 'text-red-600' },
  not_found: { emoji: '❓', title: '결제 정보 없음', desc: '결제 정보를 찾을 수 없습니다.', color: 'text-gray-600' },
  error: { emoji: '⚠️', title: '오류 발생', desc: '처리 중 오류가 발생했습니다.', color: 'text-orange-600' },
}

export default function PaymentDonePage() {
  const searchParams = useSearchParams()
  const status = searchParams.get('status') || 'error'
  const info = STATUS_MAP[status] || STATUS_MAP.error

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-10 max-w-sm w-full text-center">
        <div className="text-5xl mb-4">{info.emoji}</div>
        <h1 className={`text-xl font-bold mb-2 ${info.color}`}>{info.title}</h1>
        <p className="text-gray-500 text-sm">{info.desc}</p>
        <p className="text-xs text-gray-400 mt-6">이 창을 닫아주세요.</p>
      </div>
    </div>
  )
}
