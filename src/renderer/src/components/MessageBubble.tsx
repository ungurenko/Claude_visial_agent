import { useCallback, useRef, useState, useEffect } from 'react'
import { motion } from 'motion/react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Components } from 'react-markdown'
import { Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { getHighlighter } from '@/lib/shiki'
import { ImagePreview } from '@/components/ImagePreview'
import type { ChatMessage } from '@/types/claude'

interface MessageBubbleProps {
  message: ChatMessage
}

function formatTime(date: Date): string {
  const d = date instanceof Date ? date : new Date(date)
  return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

function ShikiCodeBlock({
  code,
  language
}: {
  code: string
  language: string
}): JSX.Element {
  const [html, setHtml] = useState<string | null>(null)
  const preRef = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let cancelled = false
    getHighlighter().then((highlighter) => {
      if (cancelled) return
      const isDark = document.documentElement.classList.contains('dark')
      const rendered = highlighter.codeToHtml(code, {
        lang: language,
        theme: isDark ? 'github-dark' : 'github-light'
      })
      setHtml(rendered)
    })
    return () => {
      cancelled = true
    }
  }, [code, language])

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [code])

  return (
    <div className="group/code relative my-2">
      {html ? (
        <div
          ref={preRef}
          className="overflow-x-auto rounded-lg text-sm [&>pre]:p-4 [&>pre]:!bg-background-tertiary"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <pre className="overflow-x-auto rounded-lg bg-background-tertiary p-4 text-sm">
          <code>{code}</code>
        </pre>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2 h-7 w-7 opacity-0 transition-opacity group-hover/code:opacity-100 hover:bg-muted"
        onClick={handleCopy}
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-green-500" />
        ) : (
          <Copy className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </Button>
    </div>
  )
}

export function MessageBubble({ message }: MessageBubbleProps): JSX.Element {
  const isUser = message.role === 'user'
  const [copied, setCopied] = useState(false)

  const handleCopyMessage = useCallback(() => {
    navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [message.content])

  const markdownComponents: Components = {
    pre({ children }) {
      return <>{children}</>
    },
    code({ className, children }) {
      const match = /language-(\w+)/.exec(className || '')
      const lang = match ? match[1] : null
      const codeString = String(children).replace(/\n$/, '')

      if (lang) {
        return <ShikiCodeBlock code={codeString} language={lang} />
      }
      return (
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">{children}</code>
      )
    },
    p({ children, ...props }) {
      return (
        <p className="mb-2 last:mb-0" {...props}>
          {children}
        </p>
      )
    },
    ul({ children, ...props }) {
      return (
        <ul className="mb-2 ml-4 list-disc last:mb-0" {...props}>
          {children}
        </ul>
      )
    },
    ol({ children, ...props }) {
      return (
        <ol className="mb-2 ml-4 list-decimal last:mb-0" {...props}>
          {children}
        </ol>
      )
    },
    a({ children, href, ...props }) {
      return (
        <a
          href={href}
          className="text-primary underline underline-offset-2 hover:text-primary/80"
          target="_blank"
          rel="noopener noreferrer"
          {...props}
        >
          {children}
        </a>
      )
    },
    blockquote({ children, ...props }) {
      return (
        <blockquote
          className="mb-2 border-l-2 border-primary/30 pl-3 italic text-muted-foreground last:mb-0"
          {...props}
        >
          {children}
        </blockquote>
      )
    },
    table({ children, ...props }) {
      return (
        <div className="mb-2 overflow-x-auto last:mb-0">
          <table className="w-full border-collapse text-sm" {...props}>
            {children}
          </table>
        </div>
      )
    },
    th({ children, ...props }) {
      return (
        <th className="border border-border px-3 py-1.5 text-left font-semibold" {...props}>
          {children}
        </th>
      )
    },
    td({ children, ...props }) {
      return (
        <td className="border border-border px-3 py-1.5" {...props}>
          {children}
        </td>
      )
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={cn('group flex flex-col', isUser ? 'items-end' : 'items-start')}
    >
      <div className="relative">
        <div
          className={cn(
            'relative whitespace-pre-wrap break-words px-4 py-2.5 text-sm leading-relaxed',
            isUser
              ? 'max-w-[80%] rounded-2xl rounded-br-md bg-gradient-to-br from-primary to-primary/90 text-primary-foreground shadow-xs'
              : 'max-w-[85%] rounded-2xl rounded-bl-md border border-border/40 bg-card shadow-xs'
          )}
        >
          {isUser && message.attachedImages && message.attachedImages.length > 0 && (
            <div className="mb-2">
              <ImagePreview images={message.attachedImages} compact />
            </div>
          )}
          {isUser ? (
            <span>{message.content}</span>
          ) : (
            <div className="prose-sm">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {message.content}
              </ReactMarkdown>
            </div>
          )}
          {message.isStreaming && (
            <span className="ml-0.5 inline-block h-4 w-[2px] animate-pulse bg-current align-text-bottom" />
          )}
        </div>

        {/* Copy message button for assistant */}
        {!isUser && !message.isStreaming && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute -right-9 top-1 h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
            onClick={handleCopyMessage}
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <Copy className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </Button>
        )}
      </div>

      <span className="mt-1 px-1 text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
        {formatTime(message.timestamp)}
      </span>
    </motion.div>
  )
}

export default MessageBubble
