import type { FastifyPluginAsync } from 'fastify'
import { encrypt, decrypt } from '../lib/crypto.js'

const workspaceRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /workspace
  fastify.post<{ Body: { name: string } }>(
    '/workspace',
    {
      preHandler: [fastify.authenticate],
      schema: {
        body: {
          type: 'object',
          required: ['name'],
          properties: { name: { type: 'string', minLength: 1, maxLength: 50 } },
        },
      },
    },
    async (request, reply) => {
      const { userId } = (request as any).user
      const { name } = request.body

      const existing = await fastify.prisma.workspace.findUnique({ where: { userId } })
      if (existing) {
        return reply.status(409).send({ error: '이미 워크스페이스가 존재합니다.' })
      }

      const workspace = await fastify.prisma.workspace.create({
        data: { name, userId },
      })

      return reply.status(201).send({ workspace })
    },
  )

  // GET /workspace
  fastify.get('/workspace', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { userId } = (request as any).user
    const workspace = await fastify.prisma.workspace.findUnique({
      where: { userId },
      select: {
        id: true,
        name: true,
        widgetToken: true,
        pgProvider: true,
        isActive: true,
        createdAt: true,
      },
    })
    if (!workspace) return reply.status(404).send({ error: '워크스페이스가 없습니다.' })
    return { workspace }
  })

  // PATCH /workspace/pg — PG API Key 등록
  fastify.patch<{ Body: { pgProvider: 'KAKAOPAY' | 'TOSS'; apiKey: string } }>(
    '/workspace/pg',
    {
      preHandler: [fastify.authenticate],
      schema: {
        body: {
          type: 'object',
          required: ['pgProvider', 'apiKey'],
          properties: {
            pgProvider: { type: 'string', enum: ['KAKAOPAY', 'TOSS'] },
            apiKey: { type: 'string', minLength: 1 },
          },
        },
      },
    },
    async (request, reply) => {
      const { userId } = (request as any).user
      const { pgProvider, apiKey } = request.body

      const encrypted = encrypt(apiKey)
      const workspace = await fastify.prisma.workspace.update({
        where: { userId },
        data: { pgProvider, pgKeyEncrypted: encrypted },
      })

      return { workspace: { id: workspace.id, pgProvider: workspace.pgProvider } }
    },
  )

  // GET /widget/:workspaceId/script — embed 스크립트 생성 (인증 필요)
  fastify.get<{ Params: { workspaceId: string } }>(
    '/widget/:workspaceId/script',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { userId } = (request as any).user
      const { workspaceId } = request.params
      // 본인 워크스페이스만 조회 가능
      const workspace = await fastify.prisma.workspace.findFirst({
        where: { id: workspaceId, userId },
      })
      if (!workspace) return reply.status(404).send({ error: '워크스페이스가 없습니다.' })

      const apiUrl = process.env.API_URL || 'http://localhost:3000'
      const script = `<script>
(function() {
  window.ChatPayConfig = { token: '${workspace.widgetToken}', apiUrl: '${apiUrl}' };
  var s = document.createElement('script');
  s.src = '${apiUrl}/widget.js';
  s.async = true;
  document.head.appendChild(s);
})();
</script>`

      return { script }
    },
  )

  // POST /widget/token — 위젯 토큰 검증
  fastify.post<{ Body: { widgetToken: string } }>(
    '/widget/token',
    {
      schema: {
        body: {
          type: 'object',
          required: ['widgetToken'],
          properties: { widgetToken: { type: 'string' } },
        },
      },
    },
    async (request, reply) => {
      const { widgetToken } = request.body
      const workspace = await fastify.prisma.workspace.findUnique({
        where: { widgetToken },
        select: { id: true, name: true, pgProvider: true, isActive: true },
      })
      if (!workspace || !workspace.isActive) {
        return reply.status(404).send({ error: '유효하지 않은 위젯 토큰입니다.' })
      }
      return { workspace }
    },
  )
}

export default workspaceRoutes
