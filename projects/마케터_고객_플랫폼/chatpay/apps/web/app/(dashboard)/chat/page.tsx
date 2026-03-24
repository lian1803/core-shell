'use client'

import { useEffect, useCallback } from 'react'
import { useAuthStore } from '@/store/auth.store'
import { useChatStore } from '@/store/chat.store'
import { getDashboardSocket } from '@/lib/socket'
import { api } from '@/lib/api'
import ChatList from '@/components/chat/ChatList'

export default function ChatPage() {
  const { token } = useAuthStore()
  const { setRooms, addRoom, addMessage, updateRoom, incrementUnread, activeRoomId } = useChatStore()

  const loadRooms = useCallback(async () => {
    try {
      const res = await api.get('/chats')
      setRooms(res.data.rooms)
    } catch (err) {
      console.error('Failed to load rooms:', err)
    }
  }, [setRooms])

  useEffect(() => {
    if (!token) return
    loadRooms()

    const socket = getDashboardSocket(token)

    socket.on('room:new', (room) => {
      addRoom(room)
    })

    socket.on('chat:activity', ({ roomId, lastMessage, updatedAt }) => {
      updateRoom(roomId, { updatedAt })
      if (roomId !== activeRoomId) {
        incrementUnread(roomId)
      }
    })

    return () => {
      socket.off('room:new')
      socket.off('chat:activity')
    }
  }, [token])

  return (
    <div className="flex h-full">
      {/* Chat List Sidebar */}
      <div className="w-80 shrink-0 border-r border-gray-100 bg-white">
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <h1 className="text-lg font-bold text-gray-800">채팅 목록</h1>
        </div>
        <ChatList />
      </div>

      {/* Empty state */}
      <div className="flex-1 flex items-center justify-center text-gray-400">
        <div className="text-center">
          <p className="text-4xl mb-3">💬</p>
          <p className="font-medium">채팅방을 선택하세요</p>
          <p className="text-sm mt-1">왼쪽 목록에서 채팅을 클릭하면 대화를 시작할 수 있어요</p>
        </div>
      </div>
    </div>
  )
}
