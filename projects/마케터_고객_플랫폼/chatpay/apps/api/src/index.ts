import Fastify from 'fastify'
import { Server } from 'socket.io'
import { createAdapter } from '@socket.io/redis-adapter'
import { createClient } from 'redis'

// Plugins
import prismaPlugin from './plugins/prisma.js'
import redisPlugin from './plugins/redis.js'
import authPlugin from './plugins/auth.js'
import corsPlugin from './plugins/cors.js'

// Routes
import authRoutes from './routes/auth.js'
import workspaceRoutes from './routes/workspace.js'
import chatRoutes from './routes/chat.js'
import paymentLinkRoutes from './routes/payment-link.js'

// Socket.io
import { setupSocketIO } from './socket/index.js'

const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
  },
})

async function bootstrap() {
  // Register plugins
  await fastify.register(corsPlugin)
  await fastify.register(prismaPlugin)
  await fastify.register(redisPlugin)
  await fastify.register(authPlugin)

  // Register routes
  await fastify.register(authRoutes)
  await fastify.register(workspaceRoutes)
  await fastify.register(chatRoutes)
  await fastify.register(paymentLinkRoutes)

  // Health check
  fastify.get('/health', async () => ({ status: 'ok', ts: new Date().toISOString() }))

  // Setup Socket.io with Redis adapter
  const pubClient = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' })
  const subClient = pubClient.duplicate()
  await Promise.all([pubClient.connect(), subClient.connect()])

  const io = new Server(fastify.server, {
    cors: {
      origin: [
        process.env.WEB_URL || 'http://localhost:3001',
        /localhost:\d+$/,
        /\.vercel\.app$/,
      ],
      credentials: true,
    },
    adapter: createAdapter(pubClient, subClient),
  })

  // Attach io to fastify for use in routes
  ;(fastify as any).io = io

  setupSocketIO(io, fastify.prisma)

  const port = parseInt(process.env.PORT || '3000')
  const host = process.env.HOST || '0.0.0.0'

  await fastify.listen({ port, host })
  fastify.log.info(`ChatPay API running on http://${host}:${port}`)
}

bootstrap().catch((err) => {
  console.error(err)
  process.exit(1)
})
