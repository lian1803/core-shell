import type { Server, Socket } from 'socket.io'
import type { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

export function setupWidgetNamespace(io: Server, prisma: PrismaClient) {
  const widget = io.of('/widget')

  // 위젯 토큰 인증 미들웨어
  widget.use(async (socket: Socket, next) => {
    const { widgetToken, visitorId } = socket.handshake.auth || {}
    if (!widgetToken) return next(new Error('Missing widget token'))

    const workspace = await prisma.workspace.findUnique({
      where: { widgetToken },
      select: { id: true, isActive: true },
    })

    if (!workspace || !workspace.isActive) {
      return next(new Error('Invalid widget token'))
    }

    ;(socket as any).workspaceId = workspace.id
    ;(socket as any).visitorId = visitorId || `visitor_${crypto.randomBytes(8).toString('hex')}`
    next()
  })

  widget.on('connection', async (socket: Socket) => {
    const workspaceId = (socket as any).workspaceId
    const visitorId = (socket as any).visitorId

    // 기존 OPEN 채팅방 복원 또는 신규 생성
    let room = await prisma.chatRoom.findFirst({
      where: { workspaceId, visitorId, status: 'OPEN' },
      include: { messages: { orderBy: { createdAt: 'asc' }, take: 50 } },
    })

    if (!room) {
      room = await prisma.chatRoom.create({
        data: { workspaceId, visitorId },
        include: { messages: { orderBy: { createdAt: 'asc' }, take: 50 } },
      })

      // 마케터에게 새 채팅 알림
      io.of('/dashboard').to(`workspace:${workspaceId}`).emit('room:new', {
        roomId: room.id,
        visitorId,
        createdAt: room.createdAt,
      })
    }

    socket.join(`room:${room.id}`)
    ;(socket as any).roomId = room.id

    // 이전 메시지 + 결제링크 전송
    const paymentLinks = await prisma.paymentLink.findMany({
      where: { roomId: room.id },
      orderBy: { createdAt: 'asc' },
    })
    socket.emit('room:init', { room, messages: room.messages, paymentLinks, visitorId })

    // 방문자 메시지 전송
    socket.on('message:send', async (data: { content: string }) => {
      const { content } = data
      const roomId = (socket as any).roomId

      if (!content?.trim() || !roomId) return

      const freshRoom = await prisma.chatRoom.findFirst({ where: { id: roomId, status: 'OPEN' } })
      if (!freshRoom) return

      const message = await prisma.message.create({
        data: { roomId, sender: 'VISITOR', content: content.trim() },
      })

      // 방문자에 echo
      widget.to(`room:${roomId}`).emit('message:new', message)
      // 마케터에 전달
      io.of('/dashboard').to(`room:${roomId}`).emit('message:new', message)
      io.of('/dashboard').to(`workspace:${workspaceId}`).emit('chat:activity', {
        roomId,
        lastMessage: content.trim(),
        updatedAt: message.createdAt,
      })

      await prisma.chatRoom.update({ where: { id: roomId }, data: { updatedAt: new Date() } })
    })

    // 타이핑 상태
    socket.on('typing:start', () => {
      const roomId = (socket as any).roomId
      io.of('/dashboard').to(`room:${roomId}`).emit('typing:visitor', { typing: true })
    })
    socket.on('typing:stop', () => {
      const roomId = (socket as any).roomId
      io.of('/dashboard').to(`room:${roomId}`).emit('typing:visitor', { typing: false })
    })

    socket.on('disconnect', () => {
      console.log(`Widget disconnected: ${socket.id}`)
    })
  })
}
