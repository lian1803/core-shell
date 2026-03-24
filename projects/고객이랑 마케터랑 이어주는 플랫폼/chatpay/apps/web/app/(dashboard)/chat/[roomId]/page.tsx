'use client'

import { useEffect } from 'react'
import { useChatStore } from '@/store/chat.store'
import { useAuthStore } from '@/store/auth.store'
import { api } from '@/lib/api'
import { getDashboardSocket } from '@/lib/socket'
import ChatList from '@/components/chat/ChatList'
import ChatRoom from '@/components/chat/ChatRoom'

interface Props {
  params: { roomId: string }
}

export default function ChatRoomPage({ params }: Props) {
  const { roomId } = params
  const { token } = useAuthStore()
  const { setRooms, addRoom, updateRoom, incrementUnread, setActiveRoom, addMessage } = useChatStore()

  useEffect(() => {
    setActiveRoom(roomId)
    return () => setActiveRoom(null)
  }, [roomId])

  useEffect(() => {
    if (!token) return

    api.get('/chats').then((res) => setRooms(res.data.rooms)).catch(() => {})

    const socket = getDashboardSocket(token)

    socket.on('room:new', (room) => addRoom(room))
    socket.on('chat:activity', ({ roomId: rid, updatedAt }) => {
      updateRoom(rid, { updatedAt })
      if (rid !== roomId) incrementUnread(rid)
    })

    return () => {
      socket.off('room:new')
      socket.off('chat:activity')
    }
  }, [token])

  return (
    <div className="flex h-full">
      {/* Chat List Sidebar */}
      <div className="hidden lg:flex w-80 shrink-0 border-r border-gray-100 bg-white flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <h1 className="text-lg font-bold text-gray-800">채팅 목록</h1>
        </div>
        <div className="flex-1 overflow-hidden">
          <ChatList />
        </div>
      </div>

      {/* Chat Room */}
      <div className="flex-1 flex flex-col min-w-0">
        <ChatRoom roomId={roomId} />
      </div>
    </div>
  )
}
