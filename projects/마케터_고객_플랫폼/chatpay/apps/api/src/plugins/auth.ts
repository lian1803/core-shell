import fp from 'fastify-plugin'
import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify'
import { verifyToken } from '../lib/jwt.js'

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
}

const authPlugin: FastifyPluginAsync = fp(async (fastify) => {
  fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    const authHeader = request.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'Unauthorized' })
    }

    const token = authHeader.slice(7)
    try {
      const payload = await verifyToken(token)
      ;(request as any).user = { userId: payload.sub, email: payload.email }
    } catch {
      return reply.status(401).send({ error: 'Invalid token' })
    }
  })
})

export default authPlugin
