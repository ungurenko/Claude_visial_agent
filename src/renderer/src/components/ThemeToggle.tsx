import { Sun, Monitor, Moon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Theme } from '@/hooks/useTheme'

interface ThemeToggleProps {
  theme: Theme
  onThemeChange: (theme: Theme) => void
}

const themes: { value: Theme; icon: typeof Sun; label: string }[] = [
  { value: 'light', icon: Sun, label: 'Светлая' },
  { value: 'system', icon: Monitor, label: 'Системная' },
  { value: 'dark', icon: Moon, label: 'Тёмная' }
]

export function ThemeToggle({ theme, onThemeChange }: ThemeToggleProps): JSX.Element {
  return (
    <div className="flex items-center gap-0.5 rounded-full bg-muted/50 p-0.5">
      {themes.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => onThemeChange(value)}
          title={label}
          className={cn(
            'flex h-6 w-6 items-center justify-center rounded-full transition-all duration-200',
            theme === value
              ? 'bg-background shadow-xs text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Icon className="h-3 w-3" />
        </button>
      ))}
    </div>
  )
}
