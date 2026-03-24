import type { FastifyPluginAsync } from 'fastify'
import bcrypt from 'bcrypt'
import crypto from 'crypto'
import { signToken } from '../lib/jwt.js'
import { sendVerificationEmail } from '../lib/email.js'

const authRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /auth/signup
  fastify.post<{ Body: { email: string; password: string } }>(
    '/auth/signup',
    {
      schema: {
        body: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 8 },
          },
        },
      },
    },
    async (request, reply) => {
      const { email, password } = request.body

      const existing = await fastify.prisma.user.findUnique({ where: { email } })
      if (existing) {
        return reply.status(409).send({ error: '이미 사용 중인 이메일입니다.' })
      }

      const passwordHash = await bcrypt.hash(password, 12)
      const emailVerifyToken = crypto.randomBytes(32).toString('hex')

      const user = await fastify.prisma.user.create({
        data: { email, passwordHash, emailVerifyToken },
      })

      // 비동기 이메일 발송 (실패해도 회원가입 성공)
      sendVerificationEmail(email, emailVerifyToken).catch((err) =>
        fastify.log.error('Email send failed:', err),
      )

      const token = await signToken(user.id, user.email)
      return reply.status(201).send({ token, user: { id: user.id, email: user.email, isEmailVerified: false } })
    },
  )

  // POST /auth/login
  fastify.post<{ Body: { email: string; password: string } }>(
    '/auth/login',
    {
      schema: {
        body: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string' },
            password: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      const { email, password } = request.body

      const user = await fastify.prisma.user.findUnique({ where: { email } })
      if (!user) {
        return reply.status(401).send({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' })
      }

      const isValid = await bcrypt.compare(password, user.passwordHash)
      if (!isValid) {
        return reply.status(401).send({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' })
      }

      const token = await signToken(user.id, user.email)
      return { token, user: { id: user.id, email: user.email, isEmailVerified: user.isEmailVerified } }
    },
  )

  // GET /auth/verify-email
  fastify.get<{ Querystring: { token: string } }>(
    '/auth/verify-email',
    async (request, reply) => {
      const { token } = request.query

      const user = await fastify.prisma.user.findFirst({ where: { emailVerifyToken: token } })
      if (!user) {
        return reply.status(400).send({ error: '유효하지 않은 인증 토큰입니다.' })
      }

      await fastify.prisma.user.update({
        where: { id: user.id },
        data: { isEmailVerified: true, emailVerifyToken: null },
      })

      return { message: '이메일 인증이 완료되었습니다.' }
    },
  )

  // GET /auth/me
  fastify.get('/auth/me', { preHandler: [fastify.authenticate] }, async (request) => {
    const { userId } = (request as any).user
    const user = await fastify.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, isEmailVerified: true, createdAt: true },
    })
    return { user }
  })
}

export default authRoutes
