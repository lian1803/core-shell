import type { FastifyPluginAsync } from 'fastify'
import { decrypt } from '../lib/crypto.js'
import { kakaoPayReady, kakaoPayApprove } from '../services/kakaopay.service.js'
import { tossConfirmPayment } from '../services/toss.service.js'
import crypto from 'crypto'
import crypto2 from 'crypto'

const paymentLinkRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /payment-link — 결제 링크 생성
  fastify.post<{
    Body: { roomId: string; productName: string; amount: number; pgProvider: 'KAKAOPAY' | 'TOSS' }
  }>(
    '/payment-link',
    {
      preHandler: [fastify.authenticate],
      schema: {
        body: {
          type: 'object',
          required: ['roomId', 'productName', 'amount', 'pgProvider'],
          properties: {
            roomId: { type: 'string' },
            productName: { type: 'string', minLength: 1, maxLength: 100 },
            // 최대 결제 금액 제한 (카카오페이 단건 한도: 1,000,000원)
            amount: { type: 'integer', minimum: 100, maximum: 1000000 },
            pgProvider: { type: 'string', enum: ['KAKAOPAY', 'TOSS'] },
          },
        },
      },
    },
    async (request, reply) => {
      const { userId } = (request as any).user
      const { roomId, productName, amount, pgProvider } = request.body

      const workspace = await fastify.prisma.workspace.findUnique({ where: { userId } })
      if (!workspace) return reply.status(404).send({ error: '워크스페이스가 없습니다.' })

      if (!workspace.pgKeyEncrypted) {
        return reply.status(400).send({ error: 'PG API Key가 등록되지 않았습니다.' })
      }

      const orderId = `chatpay_${crypto.randomBytes(8).toString('hex')}`
      const apiUrl = process.env.API_URL || 'http://localhost:3000'

      let pgTid: string | undefined
      let paymentUrl: string | undefined

      const pgKey = decrypt(workspace.pgKeyEncrypted)

      if (pgProvider === 'KAKAOPAY') {
        // 카카오페이 Ready API — approval_url은 우리 서버의 redirect endpoint
        const result = await kakaoPayReady({
          apiKey: pgKey,
          orderId,
          itemName: productName,
          amount,
          approvalUrl: `${apiUrl}/payment-callback/kakaopay/approve?paymentLinkId=__PL_ID__`,
          cancelUrl: `${apiUrl}/payment-callback/kakaopay/cancel`,
          failUrl: `${apiUrl}/payment-callback/kakaopay/fail`,
        })
        pgTid = result.tid
        paymentUrl = result.next_redirect_pc_url
      } else {
        // 토스: 클라이언트에서 결제창 직접 호출. 성공 후 /payment-callback/toss/confirm으로 redirect
        const webUrl = process.env.WEB_URL || 'http://localhost:3001'
        paymentUrl = `${webUrl}/payment/toss?orderId=${orderId}&amount=${amount}&orderName=${encodeURIComponent(productName)}`
      }

      const link = await fastify.prisma.paymentLink.create({
        data: {
          workspaceId: workspace.id,
          roomId,
          productName,
          amount,
          pgProvider,
          pgOrderId: orderId,
          pgTid,
          status: 'PENDING',
        },
      })

      // paymentUrl에 실제 paymentLinkId 주입 (카카오페이의 approval_url __PL_ID__ 치환)
      if (pgProvider === 'KAKAOPAY' && paymentUrl && pgTid) {
        // approval_url의 __PL_ID__는 서버에서만 쓰이므로 클라이언트에는 redirect_url만 노출
        // tid를 Redis에 임시 저장하여 approval 시 조회
        await fastify.redis.set(`kakaopay:tid:${orderId}`, JSON.stringify({
          tid: pgTid,
          paymentLinkId: link.id,
          workspaceId: workspace.id,
          roomId,
        }), { EX: 3600 }) // 1시간 TTL
      }

      // Socket emit — 결제 링크 생성 알림
      const io = (fastify as any).io
      if (io) {
        const messageData = {
          type: 'PAYMENT_LINK',
          paymentLinkId: link.id,
          productName,
          amount,
          pgProvider,
          paymentUrl,
          status: 'PENDING',
        }
        io.of('/dashboard').to(`room:${roomId}`).emit('payment:created', messageData)
        io.of('/widget').to(`room:${roomId}`).emit('payment:created', messageData)
      }

      return reply.status(201).send({ paymentLink: link, paymentUrl })
    },
  )

  // GET /payment-link/:id
  fastify.get<{ Params: { id: string } }>(
    '/payment-link/:id',
    async (request, reply) => {
      const { id } = request.params
      const link = await fastify.prisma.paymentLink.findUnique({ where: { id } })
      if (!link) return reply.status(404).send({ error: '결제 링크가 없습니다.' })
      return { paymentLink: link }
    },
  )

  // ─── 카카오페이 결제 승인 콜백 (Redirect 방식) ───────────────────────────────
  // 카카오페이가 결제 완료 후 approval_url로 pg_token과 함께 redirect해줌
  fastify.get<{ Querystring: { pg_token: string; orderId?: string; paymentLinkId?: string } }>(
    '/payment-callback/kakaopay/approve',
    async (request, reply) => {
      const { pg_token } = request.query

      // orderId는 approval_url에 querystring으로 넘어오거나 state로 넘어올 수 있음
      // 카카오페이는 approval_url에 추가된 파라미터를 그대로 유지해줌
      // 우리 URL: /payment-callback/kakaopay/approve?paymentLinkId=xxx
      const paymentLinkId = request.query.paymentLinkId

      if (!pg_token || !paymentLinkId) {
        return reply.status(400).send({ error: 'pg_token 또는 paymentLinkId가 없습니다.' })
      }

      // 멱등성 체크
      const idempotencyKey = `kakaopay:approved:${pg_token}`
      const processed = await fastify.redis.get(idempotencyKey)
      if (processed) {
        return reply.redirect(`${process.env.WEB_URL || 'http://localhost:3001'}/payment/done?status=already_paid`)
      }

      const link = await fastify.prisma.paymentLink.findUnique({
        where: { id: paymentLinkId },
        include: { workspace: true },
      })

      if (!link || link.status !== 'PENDING') {
        return reply.redirect(`${process.env.WEB_URL || 'http://localhost:3001'}/payment/done?status=not_found`)
      }

      if (!link.pgTid || !link.workspace.pgKeyEncrypted || !link.pgOrderId) {
        return reply.redirect(`${process.env.WEB_URL || 'http://localhost:3001'}/payment/done?status=error`)
      }

      try {
        const pgKey = decrypt(link.workspace.pgKeyEncrypted)
        await kakaoPayApprove({
          apiKey: pgKey,
          tid: link.pgTid,
          orderId: link.pgOrderId,
          pgToken: pg_token,
        })

        await fastify.prisma.paymentLink.update({
          where: { id: link.id },
          data: { status: 'PAID', paidAt: new Date() },
        })

        await fastify.redis.set(idempotencyKey, '1', { EX: 86400 })

        // Socket emit — 결제 완료
        const io = (fastify as any).io
        if (io) {
          const eventData = { paymentLinkId: link.id, status: 'PAID', paidAt: new Date() }
          io.of('/dashboard').to(`room:${link.roomId}`).emit('payment:updated', eventData)
          io.of('/widget').to(`room:${link.roomId}`).emit('payment:updated', eventData)
        }

        return reply.redirect(`${process.env.WEB_URL || 'http://localhost:3001'}/payment/done?status=paid`)
      } catch (err: any) {
        fastify.log.error('KakaoPay approval error:', err)
        return reply.redirect(`${process.env.WEB_URL || 'http://localhost:3001'}/payment/done?status=failed`)
      }
    },
  )

  fastify.get('/payment-callback/kakaopay/cancel', async (request, reply) => {
    return reply.redirect(`${process.env.WEB_URL || 'http://localhost:3001'}/payment/done?status=cancelled`)
  })

  fastify.get('/payment-callback/kakaopay/fail', async (request, reply) => {
    return reply.redirect(`${process.env.WEB_URL || 'http://localhost:3001'}/payment/done?status=failed`)
  })

  // ─── 토스페이먼츠 결제 승인 콜백 ───────────────────────────────────────────
  fastify.post<{ Body: { paymentKey: string; orderId: string; amount: number } }>(
    '/payment-callback/toss/confirm',
    async (request, reply) => {
      const { paymentKey, orderId, amount } = request.body

      // 멱등성 체크
      const idempotencyKey = `toss:confirmed:${paymentKey}`
      const processed = await fastify.redis.get(idempotencyKey)
      if (processed) return { status: 'already_processed' }

      const link = await fastify.prisma.paymentLink.findFirst({
        where: { pgOrderId: orderId, status: 'PENDING' },
        include: { workspace: true },
      })

      if (!link) return reply.status(404).send({ error: 'Payment link not found' })

      // 금액 불일치 검증 (변조 방지)
      if (link.amount !== amount) {
        return reply.status(400).send({ error: '결제 금액이 일치하지 않습니다.' })
      }

      if (!link.workspace.pgKeyEncrypted) {
        return reply.status(400).send({ error: 'PG Key 없음' })
      }

      const pgKey = decrypt(link.workspace.pgKeyEncrypted)

      try {
        await tossConfirmPayment({ apiKey: pgKey, paymentKey, orderId, amount })
      } catch (err: any) {
        fastify.log.error('Toss confirm error:', err)
        await fastify.prisma.paymentLink.update({
          where: { id: link.id },
          data: { status: 'FAILED' },
        })
        return reply.status(400).send({ error: '결제 승인 실패' })
      }

      await fastify.prisma.paymentLink.update({
        where: { id: link.id },
        data: { status: 'PAID', pgTid: paymentKey, paidAt: new Date() },
      })

      await fastify.redis.set(idempotencyKey, '1', { EX: 86400 })

      const io = (fastify as any).io
      if (io) {
        const eventData = { paymentLinkId: link.id, status: 'PAID', paidAt: new Date() }
        io.of('/dashboard').to(`room:${link.roomId}`).emit('payment:updated', eventData)
        io.of('/widget').to(`room:${link.roomId}`).emit('payment:updated', eventData)
      }

      return { status: 'ok', paymentLinkId: link.id }
    },
  )

  // ─── 토스 Webhook (보조 — 클라이언트 confirm 실패 시 백업) ────────────────────
  fastify.post<{ Body: { paymentKey: string; orderId: string; status: string }; Headers: { 'toss-signature'?: string } }>(
    '/webhook/toss',
    async (request, reply) => {
      const { paymentKey, orderId, status } = request.body

      // 토스 Webhook 시그니처 검증
      const signature = request.headers['toss-signature']
      const webhookSecret = process.env.TOSS_WEBHOOK_SECRET
      if (webhookSecret && signature) {
        const bodyStr = JSON.stringify(request.body)
        const expected = crypto2
          .createHmac('sha256', webhookSecret)
          .update(bodyStr)
          .digest('base64')
        if (expected !== signature) {
          return reply.status(401).send({ error: 'Invalid signature' })
        }
      }

      if (status !== 'DONE') return { status: 'ignored' }

      const idempotencyKey = `webhook:toss:${paymentKey}`
      const processed = await fastify.redis.get(idempotencyKey)
      if (processed) return { status: 'already_processed' }

      const link = await fastify.prisma.paymentLink.findFirst({
        where: { pgOrderId: orderId },
      })

      if (!link || link.status === 'PAID') return { status: 'skipped' }

      await fastify.prisma.paymentLink.update({
        where: { id: link.id },
        data: { status: 'PAID', pgTid: paymentKey, paidAt: new Date() },
      })

      await fastify.redis.set(idempotencyKey, '1', { EX: 86400 })

      const io = (fastify as any).io
      if (io) {
        const eventData = { paymentLinkId: link.id, status: 'PAID', paidAt: new Date() }
        io.of('/dashboard').to(`room:${link.roomId}`).emit('payment:updated', eventData)
        io.of('/widget').to(`room:${link.roomId}`).emit('payment:updated', eventData)
      }

      return { status: 'ok' }
    },
  )
}

export default paymentLinkRoutes
