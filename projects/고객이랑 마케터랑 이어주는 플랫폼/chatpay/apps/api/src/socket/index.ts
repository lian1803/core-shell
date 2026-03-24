import type { Server } from 'socket.io'
import type { PrismaClient } from '@prisma/client'
import { verifyToken } from '../lib/jwt.js'
import { setupDashboardNamespace } from './dashboard.js'
import { setupWidgetNamespace } from './widget.js'

export function setupSocketIO(io: Server, prisma: PrismaClient) {
  setupDashboardNamespace(io, prisma)
  setupWidgetNamespace(io, prisma)
}
