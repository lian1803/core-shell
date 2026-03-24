import fp from 'fastify-plugin'
import { createClient } from 'redis'
import type { FastifyPluginAsync } from 'fastify'

declare module 'fastify' {
  interface FastifyInstance {
    redis: ReturnType<typeof createClient>
  }
}

const redisPlugin: FastifyPluginAsync = fp(async (fastify) => {
  const client = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' })

  client.on('error', (err) => fastify.log.error('Redis error:', err))
  await client.connect()

  fastify.decorate('redis', client)

  fastify.addHook('onClose', async () => {
    await client.quit()
  })
})

export default redisPlugin
