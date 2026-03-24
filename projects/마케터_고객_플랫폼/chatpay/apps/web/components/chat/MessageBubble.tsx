import { cn, formatDate } from '@/lib/utils'
import type { Message } from '@/store/chat.store'

interface Props {
  message: Message
  isMarketer: boolean
}

export default function MessageBubble({ message, isMarketer }: Props) {
  return (
    <div className={cn('flex', isMarketer ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[70%] px-4 py-3 rounded-2xl text-sm leading-relaxed',
          isMarketer
            ? 'bg-indigo-600 text-white rounded-br-sm'
            : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm shadow-sm',
        )}
      >
        <p>{message.content}</p>
        <p
          className={cn(
            'text-xs mt-1 text-right',
            isMarketer ? 'text-indigo-200' : 'text-gray-400',
          )}
        >
          {formatDate(message.createdAt)}
        </p>
      </div>
    </div>
  )
}
