'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useAuthStore } from '@/store/auth.store'
import { useChatStore } from '@/store/chat.store'
import { getDashboardSocket } from '@/lib/socket'
import { api } from '@/lib/api'
import MessageBubble from './MessageBubble'
import PaymentBubble from './PaymentBubble'
import PaymentLinkModal from './PaymentLinkModal'
import { Send, CreditCard, X } from 'lucide-react'
import type { Socket } from 'socket.io-client'

interface Props {
  roomId: string
}

export default function ChatRoom({ roomId }: Props) {
  const { token } = useAuthStore()
  const {
    messages, paymentLinks, addMessage, setMessages, setPaymentLinks,
    updatePaymentLink, clearUnread, isVisitorTyping, setVisitorTyping, updateRoom
  } = useChatStore()

  const [input, setInput] = useState('')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [workspace, setWorkspace] = useState<any>(null)
  const [room, setRoom] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const socketRef = useRef<Socket | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null)

  const roomMessages = messages[roomId] || []
  const roomPaymentLinks = paymentLinks[roomId] || []
  const isTyping = isVisitorTyping[roomId] || false

  useEffect(() => {
    if (!token) return

    // Load initial data
    Promise.all([
      api.get('/workspace'),
      api.get(`/chats/${roomId}`),
    ]).then(([wsRes, chatRes]) => {
      setWorkspace(wsRes.data.workspace)
      setRoom(chatRes.data.room)
      setMessages(roomId, chatRes.data.messages)
      setPaymentLinks(roomId, chatRes.data.room.paymentLinks || [])
      setIsLoading(false)
    }).catch(() => setIsLoading(false))

    clearUnread(roomId)

    // Socket setup
    const socket = getDashboardSocket(token)
    socketRef.current = socket

    socket.emit('room:join', { roomId })

    socket.on('message:new', (msg) => {
      if (msg.roomId === roomId) {
        addMessage(roomId, msg)
      }
    })

    socket.on('payment:created', (data) => {
      if (data.roomId === roomId || data.paymentLinkId) {
        // Will be handled via re-fetch
      }
    })

    socket.on('payment:updated', (data) => {
      updatePaymentLink(data.paymentLinkId, { status: data.status, paidAt: data.paidAt })
      // Browser notification
      if (data.status === 'PAID' && typeof window !== 'undefined') {
        document.title = '💰 결제 완료! — ChatPay'
        setTimeout(() => { document.title = 'ChatPay' }, 5000)
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('결제 완료!', { body: '고객이 결제를 완료했습니다.' })
        }
      }
    })

    socket.on('typing:visitor', ({ typing }: { typing: boolean }) => {
      setVisitorTyping(roomId, typing)
    })

    socket.on('room:closed', ({ roomId: closedId }) => {
      if (closedId === roomId) {
        updateRoom(roomId, { status: 'CLOSED' })
        setRoom((prev: any) => prev ? { ...prev, status: 'CLOSED' } : prev)
      }
    })

    return () => {
      socket.emit('room:leave', { roomId })
      socket.off('message:new')
      socket.off('payment:created')
      socket.off('payment:updated')
      socket.off('typing:visitor')
      socket.off('room:closed')
    }
  }, [roomId, token])

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [roomMessages.length, isTyping])

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  function sendMessage() {
    const trimmed = input.trim()
    if (!trimmed || !socketRef.current) return
    socketRef.current.emit('message:send', { roomId, content: trimmed })
    setInput('')
    stopTyping()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value)
    startTyping()
  }

  function startTyping() {
    if (socketRef.current) socketRef.current.emit('typing:start', { roomId })
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    typingTimerRef.current = setTimeout(stopTyping, 2000)
  }

  function stopTyping() {
    if (socketRef.current) socketRef.current.emit('typing:stop', { roomId })
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
  }

  async function closeRoom() {
    if (!confirm('채팅을 종료하시겠습니까?')) return
    try {
      await api.patch(`/chats/${roomId}/close`)
    } catch (err) {
      console.error(err)
    }
  }

  // Merge messages and payment links into timeline
  const timeline = [
    ...roomMessages.map((m) => ({ type: 'message' as const, data: m, time: m.createdAt })),
    ...roomPaymentLinks.map((p) => ({ type: 'payment' as const, data: p, time: p.createdAt })),
  ].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const isClosed = room?.status === 'CLOSED'

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="h-16 bg-white border-b border-gray-100 flex items-center px-6 gap-3 shrink-0">
        <div className="w-9 h-9 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
          {room?.visitorName?.[0] || 'V'}
        </div>
        <div>
          <p className="font-semibold text-gray-800">{room?.visitorName || '방문자'}</p>
          <p className="text-xs text-gray-400">{isClosed ? '종료된 채팅' : '활성 채팅'}</p>
        </div>
        {!isClosed && (
          <button
            onClick={closeRoom}
            className="ml-auto flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition"
          >
            <X size={14} />
            채팅 종료
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-6 space-y-4">
        {timeline.map((item) => {
          if (item.type === 'message') {
            return (
              <MessageBubble
                key={item.data.id}
                message={item.data as any}
                isMarketer={item.data.sender === 'MARKETER'}
              />
            )
          }
          return (
            <PaymentBubble
              key={item.data.id}
              paymentLink={item.data as any}
              isMarketer={true}
            />
          )
        })}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1 items-center">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {!isClosed && (
        <div className="p-4 bg-white border-t border-gray-100 shrink-0">
          <div className="flex items-end gap-3">
            <button
              onClick={() => setShowPaymentModal(true)}
              className="shrink-0 p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition"
              title="결제 링크 생성"
            >
              <CreditCard size={18} />
            </button>
            <textarea
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              rows={1}
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 transition max-h-32 overflow-y-auto"
              placeholder="메시지를 입력하세요... (Enter: 전송)"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim()}
              className="shrink-0 p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}

      {showPaymentModal && (
        <PaymentLinkModal
          roomId={roomId}
          pgProvider={workspace?.pgProvider}
          onClose={() => setShowPaymentModal(false)}
          onCreated={() => {
            api.get(`/chats/${roomId}`).then((res) => {
              setPaymentLinks(roomId, res.data.room.paymentLinks || [])
            })
          }}
        />
      )}
    </div>
  )
}
