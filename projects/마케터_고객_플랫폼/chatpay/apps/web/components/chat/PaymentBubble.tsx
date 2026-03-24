import { formatAmount, formatDate, getPaymentStatusLabel, getPaymentStatusColor } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { PaymentLink } from '@/store/chat.store'
import { CreditCard, CheckCircle, XCircle, Clock } from 'lucide-react'

interface Props {
  paymentLink: PaymentLink
  isMarketer: boolean
}

const statusIcon = {
  PENDING: Clock,
  PAID: CheckCircle,
  FAILED: XCircle,
  CANCELLED: XCircle,
}

export default function PaymentBubble({ paymentLink, isMarketer }: Props) {
  const Icon = statusIcon[paymentLink.status] || Clock

  return (
    <div className={cn('flex', isMarketer ? 'justify-end' : 'justify-start')}>
      <div className="max-w-[70%] bg-white border-2 border-indigo-100 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <CreditCard size={16} className="text-indigo-500" />
          <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">결제 요청</span>
        </div>

        <p className="font-semibold text-gray-800 mb-1">{paymentLink.productName}</p>
        <p className="text-2xl font-bold text-gray-900 mb-3">{formatAmount(paymentLink.amount)}</p>

        <div
          className={cn(
            'inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all duration-500',
            getPaymentStatusColor(paymentLink.status),
          )}
        >
          <Icon size={12} />
          {getPaymentStatusLabel(paymentLink.status)}
        </div>

        {paymentLink.status === 'PAID' && paymentLink.paidAt && (
          <p className="text-xs text-gray-400 mt-2">결제 완료: {formatDate(paymentLink.paidAt)}</p>
        )}

        <p className="text-xs text-gray-400 mt-1">{formatDate(paymentLink.createdAt)}</p>
      </div>
    </div>
  )
}
