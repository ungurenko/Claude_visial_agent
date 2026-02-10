import { motion } from 'motion/react'
import { Sparkles, FolderOpen } from 'lucide-react'

interface OnboardingWelcomeProps {
  onSelectProject: () => void
}

export function OnboardingWelcome({ onSelectProject }: OnboardingWelcomeProps): JSX.Element {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-1 flex-col items-center justify-center gap-8 px-4"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5">
        <Sparkles className="h-8 w-8 text-primary" />
      </div>

      <div className="text-center">
        <h2 className="text-xl font-semibold">Claude Visual Agent</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Визуальный помощник для работы с кодом
        </p>
      </div>

      <motion.button
        whileHover={{ y: -2, scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        onClick={onSelectProject}
        className="flex w-full max-w-sm items-center gap-4 rounded-2xl border border-border/60 p-5 text-left transition-colors hover:border-primary/30 hover:bg-accent/50"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <FolderOpen className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium">Выберите папку проекта</p>
          <p className="mt-0.5 text-xs text-muted-foreground">для начала работы</p>
        </div>
      </motion.button>

      <p className="text-xs text-muted-foreground/50">Шаг 1 из 2</p>
    </motion.div>
  )
}
