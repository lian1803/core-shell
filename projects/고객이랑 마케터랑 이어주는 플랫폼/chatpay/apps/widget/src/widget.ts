import { io, Socket } from 'socket.io-client'

interface ChatPayConfig {
  token: string
  apiUrl: string
}

interface Message {
  id: string
  roomId: string
  sender: 'MARKETER' | 'VISITOR'
  content: string
  createdAt: string
}

interface PaymentLink {
  id: string
  productName: string
  amount: number
  pgProvider: string
  status: string
  paymentUrl?: string
}

export class ChatPayWidget {
  private config: ChatPayConfig
  private socket: Socket | null = null
  private visitorId: string
  private roomId: string | null = null
  private host: HTMLElement | null = null
  private shadow: ShadowRoot | null = null
  private isOpen = false
  private messages: (Message | { type: 'payment'; link: PaymentLink })[] = []

  constructor(config: ChatPayConfig) {
    this.config = config
    this.visitorId = this.getOrCreateVisitorId()
  }

  private getOrCreateVisitorId(): string {
    const key = `chatpay_visitor_${this.config.token}`
    let id = localStorage.getItem(key)
    if (!id) {
      id = `visitor_${Date.now()}_${Math.random().toString(36).slice(2)}`
      localStorage.setItem(key, id)
    }
    return id
  }

  init() {
    this.host = document.createElement('div')
    this.host.id = 'chatpay-widget-root'
    document.body.appendChild(this.host)

    this.shadow = this.host.attachShadow({ mode: 'open' })
    this.renderWidget()
    this.connectSocket()
  }

  private connectSocket() {
    this.socket = io(`${this.config.apiUrl}/widget`, {
      auth: { widgetToken: this.config.token, visitorId: this.visitorId },
      transports: ['websocket', 'polling'],
    })

    this.socket.on('room:init', (data) => {
      this.roomId = data.room.id
      this.messages = [
        ...data.messages,
        ...data.paymentLinks.map((l: PaymentLink) => ({ type: 'payment' as const, link: l })),
      ].sort((a, b) => {
        const aTime = 'createdAt' in a ? a.createdAt : a.link.createdAt || ''
        const bTime = 'createdAt' in b ? b.createdAt : b.link.createdAt || ''
        return new Date(aTime as string).getTime() - new Date(bTime as string).getTime()
      })
      this.renderMessages()
    })

    this.socket.on('message:new', (msg: Message) => {
      this.messages.push(msg)
      this.renderMessages()
      if (!this.isOpen) this.showUnreadBadge()
    })

    this.socket.on('payment:created', (data) => {
      this.messages.push({ type: 'payment', link: data })
      this.renderMessages()
    })

    this.socket.on('payment:updated', (data: { paymentLinkId: string; status: string }) => {
      this.messages = this.messages.map((m) => {
        if ('type' in m && m.type === 'payment' && m.link.id === data.paymentLinkId) {
          return { ...m, link: { ...m.link, status: data.status } }
        }
        return m
      })
      this.renderMessages()
    })

    this.socket.on('typing:marketer', ({ typing }: { typing: boolean }) => {
      this.setMarketerTyping(typing)
    })

    this.socket.on('room:closed', () => {
      this.setRoomClosed()
    })
  }

  private renderWidget() {
    if (!this.shadow) return

    this.shadow.innerHTML = `
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }

        #launcher {
          position: fixed;
          bottom: 24px;
          right: 24px;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 20px rgba(99,102,241,0.4);
          z-index: 999999;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        #launcher:hover { transform: scale(1.05); box-shadow: 0 6px 24px rgba(99,102,241,0.5); }

        #unread-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          background: #ef4444;
          color: white;
          font-size: 10px;
          font-weight: 700;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: none;
          align-items: center;
          justify-content: center;
        }

        #chat-window {
          position: fixed;
          bottom: 92px;
          right: 24px;
          width: 360px;
          height: 520px;
          background: white;
          border-radius: 20px;
          box-shadow: 0 8px 40px rgba(0,0,0,0.15);
          z-index: 999998;
          display: none;
          flex-direction: column;
          overflow: hidden;
        }
        #chat-window.open { display: flex; }

        #chat-header {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .avatar {
          width: 36px; height: 36px;
          background: rgba(255,255,255,0.3);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: 14px;
        }
        #chat-header h3 { font-size: 15px; font-weight: 600; }
        #chat-header p { font-size: 12px; opacity: 0.8; }

        #messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          background: #f8f9fc;
        }
        #messages::-webkit-scrollbar { width: 4px; }
        #messages::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 2px; }

        .msg-bubble {
          max-width: 80%;
          padding: 10px 14px;
          border-radius: 18px;
          font-size: 13px;
          line-height: 1.5;
          word-break: break-word;
        }
        .msg-marketer { background: #6366f1; color: white; align-self: flex-start; border-bottom-left-radius: 4px; }
        .msg-visitor { background: white; color: #1f2937; align-self: flex-end; border-bottom-right-radius: 4px; border: 1px solid #e5e7eb; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }

        .payment-bubble {
          background: white;
          border: 2px solid #e0e7ff;
          border-radius: 16px;
          padding: 16px;
          max-width: 85%;
          align-self: flex-start;
        }
        .payment-title { font-size: 10px; font-weight: 700; color: #6366f1; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
        .payment-product { font-weight: 600; color: #1f2937; font-size: 14px; }
        .payment-amount { font-size: 22px; font-weight: 800; color: #111827; margin: 4px 0 12px; }
        .payment-btn {
          display: block;
          width: 100%;
          padding: 10px;
          background: #6366f1;
          color: white;
          border: none;
          border-radius: 10px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          text-align: center;
          text-decoration: none;
          transition: background 0.2s;
        }
        .payment-btn:hover { background: #4f46e5; }
        .payment-btn.paid { background: #10b981; cursor: default; }
        .payment-btn.failed { background: #ef4444; cursor: default; }
        .payment-status { font-size: 11px; text-align: center; margin-top: 8px; color: #6b7280; }

        #typing-indicator {
          display: none;
          align-self: flex-start;
        }
        #typing-indicator.show { display: flex; }
        .typing-dots {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 18px;
          border-bottom-left-radius: 4px;
          padding: 10px 16px;
          display: flex;
          gap: 4px;
          align-items: center;
        }
        .dot {
          width: 6px; height: 6px;
          background: #9ca3af;
          border-radius: 50%;
          animation: bounce 1.2s infinite;
        }
        .dot:nth-child(2) { animation-delay: 0.2s; }
        .dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes bounce { 0%,80%,100% { transform: translateY(0); } 40% { transform: translateY(-6px); } }

        #closed-notice {
          display: none;
          background: #fef3c7;
          color: #92400e;
          text-align: center;
          font-size: 12px;
          padding: 8px;
        }
        #closed-notice.show { display: block; }

        #input-area {
          padding: 12px 16px;
          background: white;
          border-top: 1px solid #f1f5f9;
          display: flex;
          gap: 8px;
          align-items: flex-end;
        }
        #msg-input {
          flex: 1;
          border: 1.5px solid #e5e7eb;
          border-radius: 12px;
          padding: 10px 14px;
          font-size: 13px;
          resize: none;
          max-height: 80px;
          outline: none;
          transition: border-color 0.2s;
          font-family: inherit;
        }
        #msg-input:focus { border-color: #6366f1; }
        #send-btn {
          width: 38px; height: 38px;
          background: #6366f1;
          color: white;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          transition: background 0.2s;
        }
        #send-btn:hover { background: #4f46e5; }
        #send-btn:disabled { background: #c7d2fe; cursor: not-allowed; }
      </style>

      <button id="launcher" aria-label="채팅 열기">
        <span id="unread-badge"></span>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      </button>

      <div id="chat-window">
        <div id="chat-header">
          <div class="avatar">C</div>
          <div>
            <h3>ChatPay 채팅</h3>
            <p>무엇이든 물어보세요</p>
          </div>
        </div>
        <div id="messages"></div>
        <div id="typing-indicator">
          <div class="typing-dots">
            <div class="dot"></div><div class="dot"></div><div class="dot"></div>
          </div>
        </div>
        <div id="closed-notice">채팅이 종료되었습니다. 감사합니다!</div>
        <div id="input-area">
          <textarea id="msg-input" rows="1" placeholder="메시지를 입력하세요..."></textarea>
          <button id="send-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
      </div>
    `

    // Event listeners
    const launcher = this.shadow.getElementById('launcher')!
    launcher.addEventListener('click', () => this.toggleChat())

    const sendBtn = this.shadow.getElementById('send-btn')!
    const msgInput = this.shadow.getElementById('msg-input') as HTMLTextAreaElement

    sendBtn.addEventListener('click', () => this.sendMessage())
    msgInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        this.sendMessage()
      }
    })

    let typingTimer: ReturnType<typeof setTimeout> | null = null
    msgInput.addEventListener('input', () => {
      this.socket?.emit('typing:start')
      if (typingTimer) clearTimeout(typingTimer)
      typingTimer = setTimeout(() => this.socket?.emit('typing:stop'), 2000)
    })
  }

  private toggleChat() {
    this.isOpen = !this.isOpen
    const chatWindow = this.shadow!.getElementById('chat-window')!
    chatWindow.classList.toggle('open', this.isOpen)
    const badge = this.shadow!.getElementById('unread-badge')!
    badge.style.display = 'none'

    if (this.isOpen) {
      setTimeout(() => {
        const messages = this.shadow!.getElementById('messages')!
        messages.scrollTop = messages.scrollHeight
      }, 100)
    }
  }

  private showUnreadBadge() {
    const badge = this.shadow!.getElementById('unread-badge')!
    badge.style.display = 'flex'
    badge.textContent = '1'
  }

  private renderMessages() {
    const container = this.shadow?.getElementById('messages')
    if (!container) return

    container.innerHTML = this.messages.map((item) => {
      if ('type' in item && item.type === 'payment') {
        const link = item.link
        const isPaid = link.status === 'PAID'
        const isFailed = link.status === 'FAILED' || link.status === 'CANCELLED'
        const btnClass = isPaid ? 'paid' : isFailed ? 'failed' : ''
        const btnText = isPaid ? '결제 완료' : isFailed ? '결제 실패' : '결제하기'
        const amountStr = new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(link.amount)

        return `
          <div class="payment-bubble">
            <div class="payment-title">결제 요청</div>
            <div class="payment-product">${this.escape(link.productName)}</div>
            <div class="payment-amount">${amountStr}</div>
            ${isPaid || isFailed
              ? `<div class="payment-btn ${btnClass}">${btnText}</div>`
              : `<a href="${link.paymentUrl || '#'}" target="_blank" class="payment-btn" onclick="return ${!!link.paymentUrl}">${btnText}</a>`
            }
          </div>
        `
      }

      const msg = item as Message
      const cls = msg.sender === 'MARKETER' ? 'msg-marketer' : 'msg-visitor'
      return `<div class="msg-bubble ${cls}">${this.escape(msg.content)}</div>`
    }).join('')

    // Scroll to bottom
    container.scrollTop = container.scrollHeight
  }

  private setMarketerTyping(typing: boolean) {
    const indicator = this.shadow?.getElementById('typing-indicator')
    if (!indicator) return
    indicator.classList.toggle('show', typing)
    const messages = this.shadow?.getElementById('messages')
    if (messages) messages.scrollTop = messages.scrollHeight
  }

  private setRoomClosed() {
    const notice = this.shadow?.getElementById('closed-notice')
    const inputArea = this.shadow?.getElementById('input-area')
    if (notice) notice.classList.add('show')
    if (inputArea) inputArea.style.display = 'none'
  }

  private sendMessage() {
    const input = this.shadow?.getElementById('msg-input') as HTMLTextAreaElement
    if (!input) return
    const content = input.value.trim()
    if (!content || !this.socket) return
    this.socket.emit('message:send', { content })
    input.value = ''
    this.socket.emit('typing:stop')
  }

  private escape(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  }
}
