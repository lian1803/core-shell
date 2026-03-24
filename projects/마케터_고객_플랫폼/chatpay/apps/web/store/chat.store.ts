import { create } from 'zustand'

export interface Message {
  id: string
  roomId: string
  sender: 'MARKETER' | 'VISITOR'
  content: string
  createdAt: string
}

export interface PaymentLink {
  id: string
  roomId: string
  productName: string
  amount: number
  pgProvider: string
  status: 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED'
  createdAt: string
  paidAt?: string
}

export interface ChatRoom {
  id: string
  visitorId: string
  visitorName: string
  status: 'OPEN' | 'CLOSED'
  createdAt: string
  updatedAt: string
  messages?: Message[]
  paymentLinks?: PaymentLink[]
}

interface ChatState {
  rooms: ChatRoom[]
  activeRoomId: string | null
  messages: Record<string, Message[]>
  paymentLinks: Record<string, PaymentLink[]>
  unreadCounts: Record<string, number>
  isVisitorTyping: Record<string, boolean>

  setRooms: (rooms: ChatRoom[]) => void
  addRoom: (room: ChatRoom) => void
  updateRoom: (roomId: string, data: Partial<ChatRoom>) => void
  setActiveRoom: (roomId: string | null) => void
  addMessage: (roomId: string, message: Message) => void
  setMessages: (roomId: string, messages: Message[]) => void
  addPaymentLink: (roomId: string, link: PaymentLink) => void
  updatePaymentLink: (paymentLinkId: string, data: Partial<PaymentLink>) => void
  setPaymentLinks: (roomId: string, links: PaymentLink[]) => void
  incrementUnread: (roomId: string) => void
  clearUnread: (roomId: string) => void
  setVisitorTyping: (roomId: string, typing: boolean) => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  rooms: [],
  activeRoomId: null,
  messages: {},
  paymentLinks: {},
  unreadCounts: {},
  isVisitorTyping: {},

  setRooms: (rooms) => set({ rooms }),

  addRoom: (room) =>
    set((state) => ({
      rooms: [room, ...state.rooms.filter((r) => r.id !== room.id)],
    })),

  updateRoom: (roomId, data) =>
    set((state) => ({
      rooms: state.rooms.map((r) => (r.id === roomId ? { ...r, ...data } : r)),
    })),

  setActiveRoom: (roomId) => set({ activeRoomId: roomId }),

  addMessage: (roomId, message) =>
    set((state) => {
      const existing = state.messages[roomId] || []
      // 중복 메시지 방지 (멀티탭, 소켓 이중 수신)
      if (existing.some((m) => m.id === message.id)) return state
      return {
        messages: {
          ...state.messages,
          [roomId]: [...existing, message],
        },
      }
    }),

  setMessages: (roomId, messages) =>
    set((state) => ({
      messages: { ...state.messages, [roomId]: messages },
    })),

  addPaymentLink: (roomId, link) =>
    set((state) => ({
      paymentLinks: {
        ...state.paymentLinks,
        [roomId]: [...(state.paymentLinks[roomId] || []), link],
      },
    })),

  updatePaymentLink: (paymentLinkId, data) =>
    set((state) => {
      const updated = { ...state.paymentLinks }
      for (const roomId in updated) {
        updated[roomId] = updated[roomId].map((l) =>
          l.id === paymentLinkId ? { ...l, ...data } : l,
        )
      }
      return { paymentLinks: updated }
    }),

  setPaymentLinks: (roomId, links) =>
    set((state) => ({
      paymentLinks: { ...state.paymentLinks, [roomId]: links },
    })),

  incrementUnread: (roomId) =>
    set((state) => ({
      unreadCounts: {
        ...state.unreadCounts,
        [roomId]: (state.unreadCounts[roomId] || 0) + 1,
      },
    })),

  clearUnread: (roomId) =>
    set((state) => ({
      unreadCounts: { ...state.unreadCounts, [roomId]: 0 },
    })),

  setVisitorTyping: (roomId, typing) =>
    set((state) => ({
      isVisitorTyping: { ...state.isVisitorTyping, [roomId]: typing },
    })),
}))
