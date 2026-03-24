import axios from 'axios'

const TOSS_BASE = 'https://api.tosspayments.com/v1'

export interface TossPaymentConfirmResult {
  paymentKey: string
  orderId: string
  status: string
  totalAmount: number
  approvedAt: string
}

export async function tossConfirmPayment(params: {
  apiKey: string
  paymentKey: string
  orderId: string
  amount: number
}): Promise<TossPaymentConfirmResult> {
  const { apiKey, paymentKey, orderId, amount } = params

  const encoded = Buffer.from(`${apiKey}:`).toString('base64')
  const res = await axios.post(
    `${TOSS_BASE}/payments/confirm`,
    { paymentKey, orderId, amount },
    {
      headers: {
        Authorization: `Basic ${encoded}`,
        'Content-Type': 'application/json',
      },
    },
  )

  return res.data
}
