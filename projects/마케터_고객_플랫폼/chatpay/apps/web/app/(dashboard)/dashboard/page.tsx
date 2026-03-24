'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { MessageSquare, CreditCard, CheckCircle, TrendingUp } from 'lucide-react'

interface Stats {
  totalChats: number
  totalPaymentLinks: number
  paidLinks: number
  conversionRate: number
}

function StatsCard({
  label, value, icon: Icon, color
}: {
  label: string
  value: string | number
  icon: any
  color: string
}) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${color}`}>
        <Icon size={22} />
      </div>
      <p className="text-3xl font-bold text-gray-800">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard/stats')
      .then((res) => setStats(res.data))
      .catch(() => setStats({ totalChats: 0, totalPaymentLinks: 0, paidLinks: 0, conversionRate: 0 }))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">전환 통계</h1>
        <p className="text-gray-500 mt-1">실시간 채팅 및 결제 현황</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            label="전체 채팅 수"
            value={stats?.totalChats ?? 0}
            icon={MessageSquare}
            color="bg-indigo-50 text-indigo-600"
          />
          <StatsCard
            label="결제 링크 발송"
            value={stats?.totalPaymentLinks ?? 0}
            icon={CreditCard}
            color="bg-blue-50 text-blue-600"
          />
          <StatsCard
            label="결제 완료"
            value={stats?.paidLinks ?? 0}
            icon={CheckCircle}
            color="bg-green-50 text-green-600"
          />
          <StatsCard
            label="전환율"
            value={`${stats?.conversionRate ?? 0}%`}
            icon={TrendingUp}
            color="bg-purple-50 text-purple-600"
          />
        </div>
      )}

      <div className="mt-8 bg-indigo-50 rounded-2xl p-6">
        <h2 className="font-semibold text-indigo-800 mb-2">무료 론칭 혜택</h2>
        <p className="text-indigo-700 text-sm">현재 ChatPay는 완전 무료로 운영 중입니다. 채팅 수, 결제 링크 수 제한 없이 모든 기능을 이용하실 수 있습니다.</p>
      </div>
    </div>
  )
}
