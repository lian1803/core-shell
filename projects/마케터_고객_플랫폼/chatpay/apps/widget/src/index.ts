import { ChatPayWidget } from './widget'

declare global {
  interface Window {
    ChatPayConfig?: { token: string; apiUrl: string }
    ChatPayWidget?: typeof ChatPayWidget
  }
}

window.ChatPayWidget = ChatPayWidget

// Auto-init if config is present
if (window.ChatPayConfig?.token) {
  const widget = new ChatPayWidget(window.ChatPayConfig)
  widget.init()
}
