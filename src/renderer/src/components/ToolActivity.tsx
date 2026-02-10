import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  FileText,
  Terminal,
  Pencil,
  Wrench,
  Check,
  X,
  Loader2,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ToolUseInfo } from '@/types/claude'

interface ToolActivityProps {
  tools: ToolUseInfo[]
}

const toolConfig: Record<string, { icon: typeof FileText; bg: string; text: string; label: string }> = {
  Read: { icon: FileText, bg: 'bg-blue-500/10', text: 'text-blue-500', label: 'Читает файл' },
  Glob: { icon: FileText, bg: 'bg-cyan-500/10', text: 'text-cyan-500', label: 'Ищет файлы' },
  Grep: { icon: FileText, bg: 'bg-indigo-500/10', text: 'text-indigo-500', label: 'Ищет в файлах' },
  Write: { icon: Pencil, bg: 'bg-amber-500/10', text: 'text-amber-500', label: 'Записывает файл' },
  Edit: { icon: Pencil, bg: 'bg-purple-500/10', text: 'text-purple-500', label: 'Редактирует файл' },
  Bash: { icon: Terminal, bg: 'bg-green-500/10', text: 'text-green-500', label: 'Выполняет команду' }
}

const defaultConfig = { icon: Wrench, bg: 'bg-muted', text: 'text-muted-foreground', label: '' }

function getToolDetail(input: Record<string, unknown>): string | null {
  const value = input.file_path ?? input.command ?? input.pattern
  if (typeof value !== 'string' || value.length === 0) return null
  return value.length > 60 ? value.slice(0, 60) + '...' : value
}

export function ToolActivity({ tools }: ToolActivityProps): JSX.Element {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (tools.length === 0) return <></>

  return (
    <div className="flex flex-col gap-1.5">
      <AnimatePresence mode="popLayout">
        {tools.map((tool) => {
          const config = toolConfig[tool.name] || defaultConfig
          const Icon = config.icon
          const label = config.label || tool.name
          const detail = getToolDetail(tool.input)
          const isExpanded = expandedId === tool.id

          return (
            <motion.div
              key={tool.id}
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            >
              <div
                className={cn(
                  'relative overflow-hidden rounded-lg border bg-card text-sm transition-colors',
                  'cursor-pointer hover:bg-accent/30'
                )}
                onClick={() => setExpandedId(isExpanded ? null : tool.id)}
              >
                {/* Progress bar for running tools */}
                {tool.status === 'running' && (
                  <div className="absolute inset-x-0 top-0 h-0.5 overflow-hidden bg-primary/10">
                    <motion.div
                      className="h-full w-1/3 bg-primary/40"
                      animate={{ x: ['0%', '300%'] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                    />
                  </div>
                )}

                <div className="flex items-center gap-2.5 p-2">
                  {/* Colored icon */}
                  <div className={cn('rounded-lg p-1.5', config.bg)}>
                    <Icon className={cn('h-3.5 w-3.5', config.text)} />
                  </div>

                  {/* Tool info */}
                  <div className="min-w-0 flex-1">
                    <span className="font-medium">{label}</span>
                    {detail && (
                      <p className="truncate font-mono text-xs text-muted-foreground">{detail}</p>
                    )}
                  </div>

                  {/* Expand chevron */}
                  <motion.div
                    animate={{ rotate: isExpanded ? 90 : 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </motion.div>

                  {/* Status indicator */}
                  <div className="shrink-0">
                    {tool.status === 'running' && (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    )}
                    {tool.status === 'done' && <Check className="h-4 w-4 text-green-500" />}
                    {tool.status === 'error' && <X className="h-4 w-4 text-red-500" />}
                  </div>
                </div>

                {/* Expandable details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <pre className="mx-2 mb-2 overflow-x-auto rounded-lg bg-background-tertiary p-2 font-mono text-xs text-muted-foreground">
                        {JSON.stringify(tool.input, null, 2)}
                      </pre>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

export default ToolActivity
