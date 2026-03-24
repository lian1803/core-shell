import axios from 'axios'

const KAKAOPAY_BASE = 'https://open-api.kakaopay.com'

export interface KakaoPayReadyResult {
  tid: string
  next_redirect_pc_url: string
  next_redirect_mobile_url: string
  created_at: string
}

export interface KakaoPayApproveResult {
  tid: string
  aid: string
  amount: { total: number }
  approved_at: string
}

export async function kakaoPayReady(params: {
  apiKey: string
  orderId: string
  itemName: string
  amount: number
  approvalUrl: string
  cancelUrl: string
  failUrl: string
}): Promise<KakaoPayReadyResult> {
  const { apiKey, orderId, itemName, amount, approvalUrl, cancelUrl, failUrl } = params

  const res = await axios.post(
    `${KAKAOPAY_BASE}/online/v1/payment/ready`,
    new URLSearchParams({
      cid: 'TC0ONETIME',
      partner_order_id: orderId,
      partner_user_id: 'chatpay_widget',
      item_name: itemName,
      quantity: '1',
      total_amount: String(amount),
      tax_free_amount: '0',
      approval_url: approvalUrl,
      cancel_url: cancelUrl,
      fail_url: failUrl,
    }),
    {
      headers: {
        Authorization: `SECRET_KEY ${apiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    },
  )

  return res.data
}

export async function kakaoPayApprove(params: {
  apiKey: string
  tid: string
  orderId: string
  pgToken: string
}): Promise<KakaoPayApproveResult> {
  const { apiKey, tid, orderId, pgToken } = params

  const res = await axios.post(
    `${KAKAOPAY_BASE}/online/v1/payment/approve`,
    new URLSearchParams({
      cid: 'TC0ONETIME',
      tid,
      partner_order_id: orderId,
      partner_user_id: 'chatpay_widget',
      pg_token: pgToken,
    }),
    {
      headers: {
        Authorization: `SECRET_KEY ${apiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    },
  )

  return res.data
}
