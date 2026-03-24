import { SignJWT, jwtVerify } from 'jose'
import type { JwtPayload } from '../types/index.js'

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'change-this-secret-in-production')

export async function signToken(userId: string, email: string): Promise<string> {
  return new SignJWT({ sub: userId, email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret)
}

export async function verifyToken(token: string): Promise<JwtPayload> {
  const { payload } = await jwtVerify(token, secret)
  return payload as unknown as JwtPayload
}
