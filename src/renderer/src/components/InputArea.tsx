import { useState, useRef, useCallback, useEffect } from 'react'
import { motion } from 'motion/react'
import { ArrowUp, Square } from 'lucide-react'
import { cn } from '@/lib/utils'

interface InputAreaProps {
  onSend: (text: string) => void
  disabled: boolean
  isProcessing: boolean
  onStop: () => void
}

const MAX_ROWS = 6
const LINE_HEIGHT = 20
const PADDING_Y = 20

export function InputArea({ onSend, disabled, isProcessing, onStop }: InputAreaProps): JSX.Element {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = 'auto'
    const maxHeight = LINE_HEIGHT * MAX_ROWS + PADDING_Y
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`
  }, [])

  useEffect(() => {
    adjustHeight()
  }, [value, adjustHeight])

  const handleSend = useCallback(() => {
    const trimmed = value.trim()
    if (!trimmed || disabled || isProcessing) return
    onSend(trimmed)
    setValue('')
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    })
  }, [value, disabled, isProcessing, onSend])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend]
  )

  const canSend = value.trim().length > 0 && !disabled && !isProcessing

  return (
    <div className="border-t glass-border glass px-4 py-3">
      <div className="mx-auto flex max-w-3xl items-end gap-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Введите сообщение..."
          disabled={disabled && !isProcessing}
          rows={1}
          className={cn(
            'flex-1 resize-none rounded-2xl border border-input bg-background/80 px-4 py-2.5',
            'text-sm leading-5 placeholder:text-muted-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:border-primary/30',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'transition-shadow duration-200'
          )}
          style={{ maxHeight: LINE_HEIGHT * MAX_ROWS + PADDING_Y }}
        />
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors',
            isProcessing
              ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
              : canSend
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-primary/50 text-primary-foreground cursor-not-allowed'
          )}
          disabled={!canSend && !isProcessing}
          onClick={isProcessing ? onStop : handleSend}
        >
          {isProcessing ? (
            <Square className="h-4 w-4" />
          ) : (
            <ArrowUp className="h-4 w-4" />
          )}
        </motion.button>
      </div>
      <p className="mt-1.5 text-center text-[10px] text-muted-foreground/60">
        Enter — отправить, Shift+Enter — перенос
      </p>
    </div>
  )
}

export default InputArea
