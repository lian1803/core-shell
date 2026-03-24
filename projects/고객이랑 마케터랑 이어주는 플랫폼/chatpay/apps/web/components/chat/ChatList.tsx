'use client'

import { useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useChatStore } from '@/store/chat.store'
import { cn, formatDate } from '@/lib/utils'
import { MessageSquare } from 'lucide-react'

interface Props {
  workspaceId?: string
}

export default function ChatList({ workspaceId }: Props) {
  const pathname = usePathname()
  const { rooms, unreadCounts } = useChatStore()
  const listRef = useRef<HTMLDivElement>(null)

  const openRooms = rooms.filter((r) => r.status === 'OPEN')

  return (
    <div ref={listRef} className="h-full overflow-y-auto scrollbar-thin">
      {openRooms.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
          <MessageSquare size={40} strokeWidth={1} />
          <p className="text-sm">아직 들어온 채팅이 없습니다</p>
          <p className="text-xs text-gray-300">위젯을 사이트에 설치하면 고객이 채팅을 시작할 수 있어요</p>
        </div>
      ) : (
        openRooms.map((room) => {
          const isActive = pathname === `/chat/${room.id}`
          const unread = unreadCounts[room.id] || 0
          const lastMsg = room.messages?.[0]

          return (
            <Link
              key={room.id}
              href={`/chat/${room.id}`}
              className={cn(
                'flex items-start gap-3 px-4 py-4 border-b border-gray-50 hover:bg-gray-50 transition cursor-pointer',
                isActive && 'bg-indigo-50 border-l-2 border-l-indigo-500',
              )}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
                {room.visitorName?.[0] || 'V'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-800 truncate">{room.visitorName || '방문자'}</p>
                  <span className="text-xs text-gray-400 shrink-0 ml-2">
                    {formatDate(room.updatedAt)}
                  </span>
                </div>
                <p className="text-sm text-gray-500 truncate mt-0.5">
                  {lastMsg?.content || '새 채팅이 시작되었습니다'}
                </p>
              </div>
              {unread > 0 && (
                <span className="shrink-0 bg-indigo-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </Link>
          )
        })
      )}
    </div>
  )
}
