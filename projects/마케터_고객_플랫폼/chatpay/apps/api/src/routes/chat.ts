import type { FastifyPluginAsync } from 'fastify'

const chatRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /chats — 채팅 목록 (cursor 기반 페이지네이션)
  fastify.get<{ Querystring: { cursor?: string; limit?: string; status?: string } }>(
    '/chats',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { userId } = (request as any).user
      const { cursor, limit = '20', status } = request.query

      const workspace = await fastify.prisma.workspace.findUnique({ where: { userId } })
      if (!workspace) return reply.status(404).send({ error: '워크스페이스가 없습니다.' })

      const take = Math.min(parseInt(limit), 50)
      const rooms = await fastify.prisma.chatRoom.findMany({
        where: {
          workspaceId: workspace.id,
          ...(status ? { status: status as any } : {}),
        },
        take: take + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        orderBy: { updatedAt: 'desc' },
        include: {
          messages: { orderBy: { createdAt: 'desc' }, take: 1 },
          _count: { select: { messages: true } },
        },
      })

      const hasMore = rooms.length > take
      const items = hasMore ? rooms.slice(0, take) : rooms
      const nextCursor = hasMore ? items[items.length - 1].id : null

      return { rooms: items, nextCursor }
    },
  )

  // GET /chats/:roomId — 채팅 상세 + 메시지 목록
  fastify.get<{ Params: { roomId: string }; Querystring: { cursor?: string } }>(
    '/chats/:roomId',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { userId } = (request as any).user
      const { roomId } = request.params
      const { cursor } = request.query

      const workspace = await fastify.prisma.workspace.findUnique({ where: { userId } })
      if (!workspace) return reply.status(404).send({ error: '워크스페이스가 없습니다.' })

      const room = await fastify.prisma.chatRoom.findFirst({
        where: { id: roomId, workspaceId: workspace.id },
        include: {
          paymentLinks: { orderBy: { createdAt: 'desc' } },
        },
      })
      if (!room) return reply.status(404).send({ error: '채팅방이 없습니다.' })

      const messages = await fastify.prisma.message.findMany({
        where: { roomId },
        take: 51,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        orderBy: { createdAt: 'asc' },
      })

      const hasMore = messages.length > 50
      return { room, messages: hasMore ? messages.slice(0, 50) : messages, hasMore }
    },
  )

  // PATCH /chats/:roomId/close — 채팅 종료
  fastify.patch<{ Params: { roomId: string } }>(
    '/chats/:roomId/close',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { userId } = (request as any).user
      const { roomId } = request.params

      const workspace = await fastify.prisma.workspace.findUnique({ where: { userId } })
      if (!workspace) return reply.status(404).send({ error: '워크스페이스가 없습니다.' })

      const room = await fastify.prisma.chatRoom.findFirst({
        where: { id: roomId, workspaceId: workspace.id },
      })
      if (!room) return reply.status(404).send({ error: '채팅방이 없습니다.' })

      const updated = await fastify.prisma.chatRoom.update({
        where: { id: roomId },
        data: { status: 'CLOSED', closedAt: new Date() },
      })

      // Socket.io 이벤트 emit
      const io = (fastify as any).io
      if (io) {
        io.of('/dashboard').to(`room:${roomId}`).emit('room:closed', { roomId })
        io.of('/widget').to(`room:${roomId}`).emit('room:closed', { roomId })
      }

      return { room: updated }
    },
  )

  // GET /dashboard/stats
  fastify.get<{ Querystring: { from?: string; to?: string } }>(
    '/dashboard/stats',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { userId } = (request as any).user
      const { from, to } = request.query

      const workspace = await fastify.prisma.workspace.findUnique({ where: { userId } })
      if (!workspace) return reply.status(404).send({ error: '워크스페이스가 없습니다.' })

      const dateFilter = {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(to) } : {}),
      }

      const [totalChats, totalPaymentLinks, paidLinks] = await Promise.all([
        fastify.prisma.chatRoom.count({
          where: { workspaceId: workspace.id, ...(from || to ? { createdAt: dateFilter } : {}) },
        }),
        fastify.prisma.paymentLink.count({
          where: { workspaceId: workspace.id, ...(from || to ? { createdAt: dateFilter } : {}) },
        }),
        fastify.prisma.paymentLink.count({
          where: {
            workspaceId: workspace.id,
            status: 'PAID',
            ...(from || to ? { createdAt: dateFilter } : {}),
          },
        }),
      ])

      const conversionRate = totalPaymentLinks > 0
        ? Math.round((paidLinks / totalPaymentLinks) * 100)
        : 0

      return { totalChats, totalPaymentLinks, paidLinks, conversionRate }
    },
  )
}

export default chatRoutes
