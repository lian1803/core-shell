'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { MessageSquare } from 'lucide-react'

interface Room {
  id: string
  visitorName: string
  status: string
  createdAt: string
  updatedAt: string
  closedAt?: string
  _count: { messages: number }
}

export default function HistoryPage() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/chats?status=CLOSED&limit=50')
      .then((res) => setRooms(res.data.rooms))
      .catch(() => setRooms([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">채팅 히스토리</h1>
        <p className="text-gray-500 mt-1">종료된 채팅 기록을 확인하세요</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : rooms.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <MessageSquare size={48} strokeWidth={1} className="mx-auto mb-4" />
          <p>종료된 채팅이 없습니다</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rooms.map((room) => (
            <Link
              key={room.id}
              href={`/chat/${room.id}`}
              className="flex items-center gap-4 bg-white rounded-xl p-4 border border-gray-100 hover:border-indigo-200 hover:shadow-sm transition"
            >
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-bold text-sm shrink-0">
                {room.visitorName?.[0] || 'V'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800">{room.visitorName || '방문자'}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {formatDate(room.createdAt)} 시작 · 메시지 {room._count.messages}개
                </p>
              </div>
              <div className="shrink-0 text-xs text-gray-400">
                {room.closedAt ? formatDate(room.closedAt) + ' 종료' : ''}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
