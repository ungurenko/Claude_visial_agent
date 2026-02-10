import { useState, useCallback, useEffect } from 'react'

export interface SessionSummary {
  id: string
  title: string
  projectName: string
  messageCount: number
  totalCost: number
  createdAt: number
  updatedAt: number
}

export function useSessions() {
  const [sessions, setSessions] = useState<SessionSummary[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [initialized, setInitialized] = useState(false)

  // Load sessions from disk on mount + migrate from localStorage
  useEffect(() => {
    ;(async () => {
      // Migrate from localStorage if data exists
      const localRaw = localStorage.getItem('claude-sessions')
      if (localRaw) {
        try {
          const localSessions: SessionSummary[] = JSON.parse(localRaw)
          // Save each to disk
          for (const s of localSessions) {
            await window.sessions.save(s.id, {
              messages: [],
              claudeSessionId: null,
              totalCost: s.totalCost,
              createdAt: s.createdAt,
              updatedAt: s.updatedAt,
              title: s.title,
              projectName: s.projectName
            })
          }
          localStorage.removeItem('claude-sessions')
        } catch {
          localStorage.removeItem('claude-sessions')
        }
      }

      // Load from disk
      const list = (await window.sessions.list()) as SessionSummary[]
      setSessions(list)
      setInitialized(true)
    })()
  }, [])

  const addSession = useCallback((session: SessionSummary) => {
    setSessions((prev) => [session, ...prev])
    setActiveSessionId(session.id)
    // Persist meta to disk
    window.sessions.save(session.id, {
      messages: [],
      claudeSessionId: null,
      totalCost: session.totalCost,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      title: session.title,
      projectName: session.projectName
    })
  }, [])

  const updateSession = useCallback((id: string, updates: Partial<SessionSummary>) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates, updatedAt: Date.now() } : s))
    )
    window.sessions.updateMeta(id, updates as Record<string, unknown>)
  }, [])

  const removeSession = useCallback((id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id))
    setActiveSessionId((prev) => (prev === id ? null : prev))
    window.sessions.delete(id)
  }, [])

  const selectSession = useCallback((id: string | null) => {
    setActiveSessionId(id)
  }, [])

  return {
    sessions,
    activeSessionId,
    addSession,
    updateSession,
    removeSession,
    selectSession,
    initialized
  }
}
