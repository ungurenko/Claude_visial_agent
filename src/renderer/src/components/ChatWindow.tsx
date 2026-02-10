import { useEffect, useRef, useState, useCallback } from 'react'
import { AnimatePresence } from 'motion/react'
import { MessageBubble } from '@/components/MessageBubble'
import { WelcomeScreen } from '@/components/WelcomeScreen'
import { cn } from '@/lib/utils'
import type { ChatMessage, SessionStatus } from '@/types/claude'

interface ChatWindowProps {
  messages: ChatMessage[]
  status: SessionStatus
  projectName?: string | null
  onSuggestion?: (text: string) => void
  showOnboarding?: boolean
  onSelectProject?: () => void
}

function TypingIndicator(): JSX.Element {
  return (
    <div className="flex items-start">
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-md border border-border/40 bg-card px-4 py-3 shadow-xs">
        <span className="h-2 w-2 animate-bounce rounded-full bg-primary/40 [animation-delay:-0.3s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-primary/40 [animation-delay:-0.15s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-primary/40" />
      </div>
    </div>
  )
}

export function ChatWindow({
  messages,
  status,
  projectName,
  onSuggestion,
  showOnboarding,
  onSelectProject
}: ChatWindowProps): JSX.Element {
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const lastMessageCountRef = useRef(0)

  // Отслеживание позиции скролла
  const handleScroll = useCallback(() => {
    if (!scrollAreaRef.current) return

    const { scrollTop, scrollHeight, clientHeight } = scrollAreaRef.current
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight

    // Считаем "внизу", если меньше 100px от конца
    setIsAtBottom(distanceFromBottom < 100)
  }, [])

  // Умный автоскролл: только если пользователь внизу
  useEffect(() => {
    // Новое сообщение добавлено
    const newMessageAdded = messages.length > lastMessageCountRef.current
    lastMessageCountRef.current = messages.length

    // Скроллим только если: (пользователь внизу ИЛИ новое сообщение) И не пусто
    if (messages.length > 0 && (isAtBottom || newMessageAdded)) {
      // Небольшая задержка для завершения рендера + анимаций
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 50)
    }
  }, [messages, status, isAtBottom])

  // Подписка на события скролла
  useEffect(() => {
    if (!scrollAreaRef.current) return

    scrollAreaRef.current.addEventListener('scroll', handleScroll)
    return () => scrollAreaRef.current?.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  if (messages.length === 0) {
    return (
      <WelcomeScreen
        projectName={projectName ?? null}
        onSuggestion={onSuggestion ?? (() => {})}
        showOnboarding={showOnboarding}
        onSelectProject={onSelectProject}
      />
    )
  }

  return (
    <div
      ref={scrollAreaRef}
      className="flex-1 overflow-y-auto"
      style={{ WebkitAppRegion: 'no-drag', scrollbarGutter: 'stable' } as React.CSSProperties}
    >
      <div className={cn('mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-6')}>
        <AnimatePresence mode="popLayout">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
        </AnimatePresence>

        {status === 'thinking' && <TypingIndicator />}

        <div ref={bottomRef} />
      </div>
    </div>
  )
}

export default ChatWindow
