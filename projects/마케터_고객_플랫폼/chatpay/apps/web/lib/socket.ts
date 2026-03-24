'use client'

import { io, Socket } from 'socket.io-client'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

let dashboardSocket: Socket | null = null

export function getDashboardSocket(token: string): Socket {
  if (dashboardSocket?.connected) return dashboardSocket

  dashboardSocket = io(`${API_URL}/dashboard`, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  })

  dashboardSocket.on('connect', () => {
    console.log('[Socket] Dashboard connected:', dashboardSocket?.id)
  })

  dashboardSocket.on('connect_error', (err) => {
    console.error('[Socket] Connect error:', err.message)
  })

  dashboardSocket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason)
  })

  return dashboardSocket
}

export function disconnectDashboardSocket() {
  if (dashboardSocket) {
    dashboardSocket.disconnect()
    dashboardSocket = null
  }
}
