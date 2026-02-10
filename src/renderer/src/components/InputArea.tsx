import { useState, useRef, useCallback, useEffect } from 'react'
import { motion } from 'motion/react'
import { ArrowUp, Square, Paperclip } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ImagePreview } from '@/components/ImagePreview'
import type { AttachedImage } from '@/types/claude'

interface InputAreaProps {
  onSend: (text: string, images: AttachedImage[]) => void
  disabled: boolean
  isProcessing: boolean
  onStop: () => void
  onSelectProject?: () => void
}

const MAX_ROWS = 6
const LINE_HEIGHT = 20
const PADDING_Y = 20

export function InputArea({ onSend, disabled, isProcessing, onStop, onSelectProject }: InputAreaProps): JSX.Element {
  const [value, setValue] = useState('')
  const [attachedImages, setAttachedImages] = useState<AttachedImage[]>([])
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
    if ((!trimmed && attachedImages.length === 0) || disabled || isProcessing) return
    onSend(trimmed, attachedImages)
    setValue('')
    setAttachedImages([])
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    })
  }, [value, attachedImages, disabled, isProcessing, onSend])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
      if (e.key === 'Escape' && isProcessing) {
        e.preventDefault()
        onStop()
      }
    },
    [handleSend, isProcessing, onStop]
  )

  const handleSelectImages = useCallback(async () => {
    const images = await window.dialog.selectImages()
    if (images) {
      setAttachedImages((prev) => [...prev, ...images])
    }
  }, [])

  const handlePaste = useCallback(async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items
    if (!items) return

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault()
        const blob = item.getAsFile()
        if (!blob) continue
        const ext = item.type.split('/')[1] === 'jpeg' ? 'jpg' : item.type.split('/')[1]
        const buffer = new Uint8Array(await blob.arrayBuffer())
        const image = await window.fs.saveClipboardImage(buffer, ext)
        setAttachedImages((prev) => [...prev, image])
        break
      }
    }
  }, [])

  const handleRemoveImage = useCallback((id: string) => {
    setAttachedImages((prev) => prev.filter((img) => img.id !== id))
  }, [])

  const canSend = (value.trim().length > 0 || attachedImages.length > 0) && !disabled && !isProcessing

  return (
    <div className="border-t glass-border glass px-4 py-3">
      <div className="mx-auto max-w-3xl">
        {attachedImages.length > 0 && (
          <div className="mb-2">
            <ImagePreview images={attachedImages} onRemove={handleRemoveImage} />
          </div>
        )}
        <div className="flex items-end gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors',
              'text-muted-foreground hover:text-foreground hover:bg-muted',
              (disabled && !isProcessing) && 'opacity-50 cursor-not-allowed'
            )}
            disabled={disabled && !isProcessing}
            onClick={handleSelectImages}
            title="Прикрепить изображение"
          >
            <Paperclip className="h-4 w-4" />
          </motion.button>
          <div className="relative flex-1">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder={disabled ? '' : 'Введите сообщение...'}
              disabled={disabled && !isProcessing}
              rows={1}
              className={cn(
                'w-full resize-none rounded-2xl border border-input bg-background/80 px-4 py-2.5',
                'text-sm leading-5 placeholder:text-muted-foreground',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:border-primary/30',
                'disabled:cursor-not-allowed disabled:opacity-50',
                'transition-shadow duration-200',
                disabled && !isProcessing && 'opacity-60'
              )}
              style={{ maxHeight: LINE_HEIGHT * MAX_ROWS + PADDING_Y, scrollbarWidth: 'none' }}
            />
            {disabled && !isProcessing && (
              <button
                onClick={onSelectProject}
                className="absolute inset-0 flex items-center px-4 text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer"
              >
                Выберите проект для начала работы →
              </button>
            )}
          </div>
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
          Enter — отправить, Shift+Enter — перенос, Cmd+V — вставить скриншот
        </p>
      </div>
    </div>
  )
}

export default InputArea
