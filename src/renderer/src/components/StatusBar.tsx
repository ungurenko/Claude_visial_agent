import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { ThemeToggle } from '@/components/ThemeToggle'
import type { SessionStatus, ModelAlias } from '@/types/claude'
import type { Theme } from '@/hooks/useTheme'

interface StatusBarProps {
  status: SessionStatus
  totalCost: number
  model: ModelAlias
  theme: Theme
  onThemeChange: (theme: Theme) => void
}

const statusConfig: Record<SessionStatus, { color: string; pulse: boolean; label: string }> = {
  idle: { color: 'bg-gray-400', pulse: false, label: 'Готов' },
  thinking: { color: 'bg-amber-400', pulse: true, label: 'Claude думает...' },
  executing: { color: 'bg-blue-400', pulse: true, label: 'Выполняет...' },
  done: { color: 'bg-green-400', pulse: false, label: 'Готово' },
  error: { color: 'bg-red-400', pulse: false, label: 'Ошибка' }
}

const modelLabels: Record<ModelAlias, string> = {
  sonnet: 'Sonnet 4.5',
  opus: 'Opus 4.6',
  haiku: 'Haiku 4.5'
}

export function StatusBar({ status, totalCost, model, theme, onThemeChange }: StatusBarProps): JSX.Element {
  const { color, pulse, label } = statusConfig[status]

  return (
    <div className="flex h-9 shrink-0 items-center justify-between border-t glass-border glass px-4 text-xs">
      {/* Left: status */}
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          {pulse && (
            <span
              className={cn(
                'absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 transition-colors duration-300',
                color
              )}
            />
          )}
          <span className={cn('relative inline-flex h-2 w-2 rounded-full transition-colors duration-300', color)} />
        </span>
        <span className="text-muted-foreground">{label}</span>
      </div>

      {/* Center: model badge */}
      <Badge variant="secondary" className="px-2 py-0 text-[10px] font-medium">
        {modelLabels[model]}
      </Badge>

      {/* Right: cost + theme toggle */}
      <div className="flex items-center gap-3">
        {totalCost > 0 && (
          <span className="font-mono text-muted-foreground">${totalCost.toFixed(4)}</span>
        )}
        <ThemeToggle theme={theme} onThemeChange={onThemeChange} />
      </div>
    </div>
  )
}

export default StatusBar
