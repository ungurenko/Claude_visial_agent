import { useState, useMemo, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Plus,
  PanelLeftClose,
  Search,
  Trash2,
  FolderOpen,
  MessageSquare
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { SessionSummary } from '@/hooks/useSessions'

interface SidebarProps {
  sessions: SessionSummary[]
  activeSessionId: string | null
  collapsed: boolean
  projectDir: string | null
  onNewChat: () => void
  onSelectSession: (id: string) => void
  onDeleteSession: (id: string) => void
  onToggleCollapse: () => void
  onRenameSession?: (id: string, title: string) => void
}

function getDateGroup(timestamp: number): string {
  const now = new Date()
  const date = new Date(timestamp)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 86400000)
  const weekAgo = new Date(today.getTime() - 7 * 86400000)

  if (date >= today) return 'Сегодня'
  if (date >= yesterday) return 'Вчера'
  if (date >= weekAgo) return 'На этой неделе'
  return 'Ранее'
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function Sidebar({
  sessions,
  activeSessionId,
  collapsed,
  projectDir,
  onNewChat,
  onSelectSession,
  onDeleteSession,
  onToggleCollapse,
  onRenameSession
}: SidebarProps): JSX.Element {
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const editInputRef = useRef<HTMLInputElement>(null)
  const projectName = projectDir ? projectDir.split('/').pop() || projectDir : null

  const filteredSessions = useMemo(() => {
    if (!search.trim()) return sessions
    const q = search.toLowerCase()
    return sessions.filter((s) => s.title.toLowerCase().includes(q))
  }, [sessions, search])

  const groupedSessions = useMemo(() => {
    const groups: Record<string, SessionSummary[]> = {}
    for (const session of filteredSessions) {
      const group = getDateGroup(session.updatedAt)
      if (!groups[group]) groups[group] = []
      groups[group].push(session)
    }
    return groups
  }, [filteredSessions])

  const groupOrder = ['Сегодня', 'Вчера', 'На этой неделе', 'Ранее']

  // Focus edit input when editing starts
  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.select()
    }
  }, [editingId])

  const startRename = (session: SessionSummary): void => {
    setEditingId(session.id)
    setEditValue(session.title)
  }

  const commitRename = (): void => {
    if (editingId && editValue.trim() && onRenameSession) {
      onRenameSession(editingId, editValue.trim())
    }
    setEditingId(null)
    setEditValue('')
  }

  const cancelRename = (): void => {
    setEditingId(null)
    setEditValue('')
  }

  return (
    <motion.aside
      animate={{ width: collapsed ? 52 : 260 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="flex h-full shrink-0 flex-col glass border-r glass-border overflow-hidden"
      style={{ paddingTop: 38 }}
    >
      {/* Header buttons */}
      <div className="flex items-center gap-1 p-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={onToggleCollapse}
          title={collapsed ? 'Развернуть (Cmd+B)' : 'Свернуть (Cmd+B)'}
        >
          <motion.div animate={{ rotate: collapsed ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <PanelLeftClose className="h-4 w-4" />
          </motion.div>
        </Button>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="ml-auto"
            >
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onNewChat}
                title="Новый чат (Cmd+N)"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Search + Sessions list (expanded only) */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex min-h-0 flex-1 flex-col"
          >
            {/* Search */}
            <div className="px-2 pb-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Поиск..."
                  className="h-8 w-full rounded-lg bg-background/60 pl-8 pr-3 text-xs placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring/30"
                />
              </div>
            </div>

            {/* Session list */}
            <ScrollArea className="flex-1 px-1.5">
              {filteredSessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-10 text-muted-foreground">
                  <MessageSquare className="h-5 w-5 stroke-[1.5]" />
                  <span className="text-xs">
                    {search ? 'Ничего не найдено' : 'Нет сессий'}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col gap-3 pb-2">
                  {groupOrder.map((group) => {
                    const items = groupedSessions[group]
                    if (!items || items.length === 0) return null
                    return (
                      <div key={group}>
                        <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                          {group}
                        </p>
                        <AnimatePresence mode="popLayout">
                          {items.map((session) => (
                            <motion.div
                              key={session.id}
                              layout
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, x: -20 }}
                              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            >
                              <button
                                onClick={() => onSelectSession(session.id)}
                                onDoubleClick={() => startRename(session)}
                                className={cn(
                                  'group flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors',
                                  session.id === activeSessionId
                                    ? 'bg-accent'
                                    : 'hover:bg-accent/50'
                                )}
                              >
                                <div className="min-w-0 flex-1">
                                  {editingId === session.id ? (
                                    <input
                                      ref={editInputRef}
                                      value={editValue}
                                      onChange={(e) => setEditValue(e.target.value)}
                                      onBlur={commitRename}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault()
                                          commitRename()
                                        }
                                        if (e.key === 'Escape') {
                                          e.preventDefault()
                                          cancelRename()
                                        }
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                      className="w-full truncate rounded bg-background px-1 text-sm font-medium outline-none ring-1 ring-ring/30"
                                    />
                                  ) : (
                                    <p className="truncate text-sm font-medium">{session.title}</p>
                                  )}
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-muted-foreground">
                                      {formatTime(session.updatedAt)}
                                    </span>
                                    {session.totalCost > 0 && (
                                      <span className="font-mono text-[10px] text-muted-foreground">
                                        ${session.totalCost.toFixed(4)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onDeleteSession(session.id)
                                  }}
                                  className="shrink-0 rounded p-1 opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </button>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    )
                  })}
                </div>
              )}
            </ScrollArea>

            {/* Footer */}
            <div className="border-t glass-border px-3 py-2.5">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <FolderOpen className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{projectName ?? 'Нет проекта'}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  )
}

export default Sidebar
