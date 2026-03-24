import type { FastifyRequest } from 'fastify'

export interface AuthUser {
  userId: string
  email: string
}

export interface JwtPayload {
  sub: string
  email: string
  iat: number
  exp: number
}

export interface AuthenticatedRequest extends FastifyRequest {
  user: AuthUser
}

export interface SignupBody {
  email: string
  password: string
}

export interface LoginBody {
  email: string
  password: string
}

export interface CreateWorkspaceBody {
  name: string
}

export interface UpdatePgKeyBody {
  pgProvider: 'KAKAOPAY' | 'TOSS'
  apiKey: string
}

export interface CreatePaymentLinkBody {
  roomId: string
  productName: string
  amount: number
  pgProvider: 'KAKAOPAY' | 'TOSS'
}

export interface SendMessageBody {
  content: string
}
