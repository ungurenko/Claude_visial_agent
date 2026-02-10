import { useState, useEffect, useCallback, useRef } from 'react'
import type {
  ChatMessage,
  SessionStatus,
  ToolUseInfo,
  ClaudeEvent,
  AssistantMessageEvent,
  SystemInitEvent,
  ResultEvent,
  AttachedImage
} from '@/types/claude'

interface SessionSnapshot {
  messages: ChatMessage[]
  claudeSessionId: string | null
  status: SessionStatus
  totalCost: number
  currentTools: ToolUseInfo[]
}

export function useClaude() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [status, setStatus] = useState<SessionStatus>('idle')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [totalCost, setTotalCost] = useState(0)
  const [currentTools, setCurrentTools] = useState<ToolUseInfo[]>([])

  const sessionsCacheRef = useRef(new Map<string, SessionSnapshot>())
  const appSessionIdRef = useRef<string | null>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const messagesRef = useRef(messages)
  messagesRef.current = messages
  const sessionIdRef = useRef(sessionId)
  sessionIdRef.current = sessionId
  const totalCostRef = useRef(totalCost)
  totalCostRef.current = totalCost

  // Save current session to disk
  const saveToDisk = useCallback(() => {
    const appId = appSessionIdRef.current
    if (!appId || messagesRef.current.length === 0) return

    const cached = sessionsCacheRef.current.get(appId)
    window.sessions.save(appId, {
      messages: messagesRef.current,
      claudeSessionId: sessionIdRef.current,
      totalCost: totalCostRef.current,
      createdAt: cached?.messages[0]?.timestamp
        ? new Date(cached.messages[0].timestamp).getTime()
        : Date.now(),
      updatedAt: Date.now()
    })
  }, [])

  // Debounced save - 2 seconds after last change
  const scheduleSave = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
    }
    saveTimerRef.current = setTimeout(saveToDisk, 2000)
  }, [saveToDisk])

  // Save on beforeunload
  useEffect(() => {
    const handler = (): void => {
      saveToDisk()
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [saveToDisk])

  useEffect(() => {
    const unsubEvent = window.claude.onEvent((rawEvent: unknown) => {
      const event = rawEvent as ClaudeEvent

      // system init — save session_id, switch to thinking
      if (event.type === 'system' && (event as SystemInitEvent).subtype === 'init') {
        const initEvent = event as SystemInitEvent
        setSessionId(initEvent.session_id)
        setStatus('thinking')
        return
      }

      // assistant message — extract text and tool_use blocks
      if (event.type === 'assistant') {
        const assistantEvent = event as AssistantMessageEvent
        const content = assistantEvent.message?.content || []
        let textContent = ''
        const tools: ToolUseInfo[] = []

        for (const block of content) {
          if (block.type === 'text') {
            textContent += block.text
          }
          if (block.type === 'tool_use') {
            tools.push({
              id: block.id,
              name: block.name,
              input: block.input || {},
              status: 'running'
            })
          }
        }

        if (textContent) {
          setMessages((prev) => {
            const last = prev[prev.length - 1]
            // If last message is a streaming assistant message, update its content
            if (last && last.role === 'assistant' && last.isStreaming) {
              return [
                ...prev.slice(0, -1),
                {
                  ...last,
                  content: textContent,
                  toolUse: tools.length > 0 ? tools : last.toolUse
                }
              ]
            }
            // Otherwise create a new assistant message
            return [
              ...prev,
              {
                id: assistantEvent.message?.id || crypto.randomUUID(),
                role: 'assistant',
                content: textContent,
                isStreaming: true,
                timestamp: new Date(),
                toolUse: tools.length > 0 ? tools : undefined
              }
            ]
          })
        }

        if (tools.length > 0) {
          setCurrentTools(tools)
          setStatus('executing')
        }
        return
      }

      // result — mark completion, update cost
      if (event.type === 'result') {
        const resultEvent = event as ResultEvent
        setStatus(resultEvent.subtype === 'success' ? 'done' : 'error')
        setTotalCost(resultEvent.total_cost_usd || 0)
        setCurrentTools([])

        // Mark last assistant message as no longer streaming
        setMessages((prev) => {
          const last = prev[prev.length - 1]
          if (last && last.role === 'assistant') {
            return [...prev.slice(0, -1), { ...last, isStreaming: false }]
          }
          return prev
        })
      }
    })

    const unsubError = window.claude.onError((error: string) => {
      console.error('Claude error:', error)
      setStatus('error')
      setCurrentTools([])

      // Add error as a system-like assistant message so the user sees it
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `Error: ${error}`,
          timestamp: new Date(),
          isStreaming: false
        }
      ])
    })

    const unsubComplete = window.claude.onComplete(() => {
      // Reset status if still in a processing state
      setStatus((prev) => (prev === 'thinking' || prev === 'executing' ? 'done' : prev))
      setCurrentTools([])

      // Ensure any streaming message is finalized
      setMessages((prev) => {
        const last = prev[prev.length - 1]
        if (last && last.role === 'assistant' && last.isStreaming) {
          return [...prev.slice(0, -1), { ...last, isStreaming: false }]
        }
        return prev
      })
    })

    return () => {
      unsubEvent()
      unsubError()
      unsubComplete()
    }
  }, [])

  const sendMessage = useCallback(
    (prompt: string, projectDir: string, attachedImages?: AttachedImage[], model?: string) => {
      // Build CLI prompt with image paths if images are attached
      let cliPrompt = prompt
      if (attachedImages && attachedImages.length > 0) {
        const imageLines = attachedImages.map(
          (img, i) => `Image ${i + 1}: ${img.path}`
        )
        const suffix = `\n\nAttached images:\n${imageLines.join('\n')}`
        cliPrompt = prompt ? prompt + suffix : `Please analyze the following images:\n\nAttached images:\n${imageLines.join('\n')}`
      }

      // Add user message to chat (with original prompt and images for display)
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'user',
          content: prompt,
          attachedImages: attachedImages && attachedImages.length > 0 ? attachedImages : undefined,
          timestamp: new Date()
        }
      ])
      setStatus('thinking')
      window.claude.execute(cliPrompt, projectDir, sessionId || undefined, model)
    },
    [sessionId]
  )

  const stopGeneration = useCallback(() => {
    window.claude.stop()
    setStatus('idle')
    setCurrentTools([])

    // Finalize any streaming message
    setMessages((prev) => {
      const last = prev[prev.length - 1]
      if (last && last.role === 'assistant' && last.isStreaming) {
        return [...prev.slice(0, -1), { ...last, isStreaming: false }]
      }
      return prev
    })
  }, [])

  const newChat = useCallback(() => {
    // Save current session before clearing
    saveToDisk()
    setMessages([])
    setSessionId(null)
    setStatus('idle')
    setTotalCost(0)
    setCurrentTools([])
  }, [saveToDisk])

  // Sync current state to cache whenever it changes + schedule disk save
  useEffect(() => {
    if (appSessionIdRef.current) {
      sessionsCacheRef.current.set(appSessionIdRef.current, {
        messages,
        claudeSessionId: sessionId,
        status,
        totalCost,
        currentTools
      })
      if (messages.length > 0) {
        scheduleSave()
      }
    }
  }, [messages, sessionId, status, totalCost, currentTools, scheduleSave])

  const switchSession = useCallback(
    async (newAppSessionId: string | null) => {
      // Save current session before switching
      saveToDisk()
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
        saveTimerRef.current = null
      }

      appSessionIdRef.current = newAppSessionId

      if (newAppSessionId && sessionsCacheRef.current.has(newAppSessionId)) {
        // Load from in-memory cache (fast)
        const cached = sessionsCacheRef.current.get(newAppSessionId)!
        setMessages(cached.messages)
        setSessionId(cached.claudeSessionId)
        setStatus(cached.status)
        setTotalCost(cached.totalCost)
        setCurrentTools(cached.currentTools)
      } else if (newAppSessionId) {
        // Load from disk (second level cache)
        const diskData = (await window.sessions.load(newAppSessionId)) as {
          messages: ChatMessage[]
          claudeSessionId: string | null
          totalCost: number
        } | null

        if (diskData && diskData.messages && diskData.messages.length > 0) {
          // Restore Date objects for timestamps
          const restoredMessages = diskData.messages.map((m) => ({
            ...m,
            timestamp: new Date(m.timestamp)
          }))
          setMessages(restoredMessages)
          setSessionId(diskData.claudeSessionId)
          setStatus('idle')
          setTotalCost(diskData.totalCost)
          setCurrentTools([])

          // Also cache in memory
          sessionsCacheRef.current.set(newAppSessionId, {
            messages: restoredMessages,
            claudeSessionId: diskData.claudeSessionId,
            status: 'idle',
            totalCost: diskData.totalCost,
            currentTools: []
          })
        } else {
          setMessages([])
          setSessionId(null)
          setStatus('idle')
          setTotalCost(0)
          setCurrentTools([])
        }
      } else {
        setMessages([])
        setSessionId(null)
        setStatus('idle')
        setTotalCost(0)
        setCurrentTools([])
      }
    },
    [saveToDisk]
  )

  const removeSessionCache = useCallback((id: string) => {
    sessionsCacheRef.current.delete(id)
  }, [])

  const resetStatusToIdle = useCallback(() => {
    setStatus((prev) => (prev === 'done' ? 'idle' : prev))
  }, [])

  return {
    messages,
    status,
    sessionId,
    totalCost,
    currentTools,
    sendMessage,
    stopGeneration,
    newChat,
    switchSession,
    removeSessionCache,
    resetStatusToIdle
  }
}
