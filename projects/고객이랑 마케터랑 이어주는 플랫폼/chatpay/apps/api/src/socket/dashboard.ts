import type { Server, Socket } from 'socket.io'
import type { PrismaClient } from '@prisma/client'
import { verifyToken } from '../lib/jwt.js'

export function setupDashboardNamespace(io: Server, prisma: PrismaClient) {
  const dashboard = io.of('/dashboard')

  // JWT 인증 미들웨어
  dashboard.use(async (socket: Socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1]
    if (!token) return next(new Error('Unauthorized'))

    try {
      const payload = await verifyToken(token)
      ;(socket as any).userId = payload.sub
      next()
    } catch {
      next(new Error('Invalid token'))
    }
  })

  dashboard.on('connection', async (socket: Socket) => {
    const userId = (socket as any).userId

    // 워크스페이스 방에 자동 join
    const workspace = await prisma.workspace.findUnique({ where: { userId } })
    if (workspace) {
      socket.join(`workspace:${workspace.id}`)
    }

    // 특정 채팅방 구독
    socket.on('room:join', async (data: { roomId: string }) => {
      const { roomId } = data
      if (!workspace) return

      const room = await prisma.chatRoom.findFirst({
        where: { id: roomId, workspaceId: workspace.id },
      })
      if (room) socket.join(`room:${roomId}`)
    })

    socket.on('room:leave', (data: { roomId: string }) => {
      socket.leave(`room:${data.roomId}`)
    })

    // 마케터 메시지 전송
    socket.on('message:send', async (data: { roomId: string; content: string }) => {
      const { roomId, content } = data
      if (!workspace || !content?.trim()) return

      const room = await prisma.chatRoom.findFirst({
        where: { id: roomId, workspaceId: workspace.id, status: 'OPEN' },
      })
      if (!room) return

      const message = await prisma.message.create({
        data: { roomId, sender: 'MARKETER', content: content.trim() },
      })

      // 마케터 대시보드에 echo
      dashboard.to(`room:${roomId}`).emit('message:new', message)
      // 위젯(방문자)에 전달
      io.of('/widget').to(`room:${roomId}`).emit('message:new', message)

      // 채팅방 updatedAt 갱신
      await prisma.chatRoom.update({ where: { id: roomId }, data: { updatedAt: new Date() } })
    })

    // 타이핑 상태
    socket.on('typing:start', (data: { roomId: string }) => {
      io.of('/widget').to(`room:${data.roomId}`).emit('typing:marketer', { typing: true })
    })
    socket.on('typing:stop', (data: { roomId: string }) => {
      io.of('/widget').to(`room:${data.roomId}`).emit('typing:marketer', { typing: false })
    })

    socket.on('disconnect', () => {
      console.log(`Dashboard disconnected: ${socket.id}`)
    })
  })
}
