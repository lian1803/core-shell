'use client'

import { useState } from 'react'
import { api } from '@/lib/api'
import { formatAmount } from '@/lib/utils'
import { X, CreditCard } from 'lucide-react'

interface Props {
  roomId: string
  pgProvider?: string | null
  onClose: () => void
  onCreated: () => void
}

export default function PaymentLinkModal({ roomId, pgProvider, onClose, onCreated }: Props) {
  const [form, setForm] = useState({
    productName: '',
    amount: '',
    pgProvider: pgProvider || 'KAKAOPAY',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const amount = parseInt(form.amount.replace(/[^0-9]/g, ''))
    if (isNaN(amount) || amount < 100) {
      setError('최소 결제 금액은 100원입니다.')
      return
    }

    setLoading(true)
    try {
      await api.post('/payment-link', {
        roomId,
        productName: form.productName,
        amount,
        pgProvider: form.pgProvider,
      })
      onCreated()
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.error || '결제 링크 생성에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const amountNum = parseInt(form.amount.replace(/[^0-9]/g, '')) || 0

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <CreditCard size={20} className="text-indigo-600" />
            <h2 className="text-lg font-bold text-gray-800">결제 링크 생성</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">상품명</label>
            <input
              type="text"
              required
              maxLength={100}
              value={form.productName}
              onChange={(e) => setForm({ ...form, productName: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="예: 스킨케어 패키지 3종"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">금액 (원)</label>
            <input
              type="text"
              required
              value={form.amount}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^0-9]/g, '')
                setForm({ ...form, amount: raw })
              }}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="0"
            />
            {amountNum > 0 && (
              <p className="text-xs text-indigo-600 mt-1">{formatAmount(amountNum)}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">결제 수단</label>
            <div className="flex gap-3">
              {(['KAKAOPAY', 'TOSS'] as const).map((pg) => (
                <button
                  key={pg}
                  type="button"
                  onClick={() => setForm({ ...form, pgProvider: pg })}
                  className={`flex-1 py-3 rounded-xl border-2 text-sm font-semibold transition ${
                    form.pgProvider === pg
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {pg === 'KAKAOPAY' ? '카카오페이' : '토스페이먼츠'}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 transition"
            >
              {loading ? '생성 중...' : '결제 링크 전송'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
