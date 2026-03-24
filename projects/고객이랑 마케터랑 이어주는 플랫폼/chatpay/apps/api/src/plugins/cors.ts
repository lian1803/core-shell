import fp from 'fastify-plugin'
import cors from '@fastify/cors'
import type { FastifyPluginAsync } from 'fastify'

const corsPlugin: FastifyPluginAsync = fp(async (fastify) => {
  fastify.register(cors, {
    origin: [
      process.env.WEB_URL || 'http://localhost:3001',
      process.env.WIDGET_URL || 'http://localhost:3002',
      /\.vercel\.app$/,
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })
})

export default corsPlugin
