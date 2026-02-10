import { useState, useCallback } from 'react'

export interface SessionSummary {
  id: string
  title: string
  projectName: string
  messageCount: number
  totalCost: number
  createdAt: number
  updatedAt: number
}

function loadSessions(): SessionSummary[] {
  try {
    const raw = localStorage.getItem('claude-sessions')
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveSessions(sessions: SessionSummary[]): void {
  localStorage.setItem('claude-sessions', JSON.stringify(sessions))
}

export function useSessions() {
  const [sessions, setSessions] = useState<SessionSummary[]>(loadSessions)
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)

  const addSession = useCallback((session: SessionSummary) => {
    setSessions((prev) => {
      const next = [session, ...prev]
      saveSessions(next)
      return next
    })
    setActiveSessionId(session.id)
  }, [])

  const updateSession = useCallback((id: string, updates: Partial<SessionSummary>) => {
    setSessions((prev) => {
      const next = prev.map((s) => (s.id === id ? { ...s, ...updates, updatedAt: Date.now() } : s))
      saveSessions(next)
      return next
    })
  }, [])

  const removeSession = useCallback((id: string) => {
    setSessions((prev) => {
      const next = prev.filter((s) => s.id !== id)
      saveSessions(next)
      return next
    })
    setActiveSessionId((prev) => (prev === id ? null : prev))
  }, [])

  const selectSession = useCallback((id: string | null) => {
    setActiveSessionId(id)
  }, [])

  return { sessions, activeSessionId, addSession, updateSession, removeSession, selectSession }
}
