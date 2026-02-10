import { motion } from 'motion/react'
import { Sparkles, LayoutGrid, ListTodo, Bug, Zap } from 'lucide-react'

interface WelcomeScreenProps {
  projectName: string | null
  onSuggestion: (text: string) => void
}

const suggestions = [
  {
    icon: LayoutGrid,
    text: 'Покажи архитектуру проекта',
    prompt:
      'Покажи архитектуру этого проекта: структуру файлов, основные модули и их взаимосвязи'
  },
  {
    icon: ListTodo,
    text: 'Найди TODO в коде',
    prompt: 'Найди все TODO, FIXME и HACK комментарии в проекте'
  },
  {
    icon: Bug,
    text: 'Найди потенциальные баги',
    prompt:
      'Проанализируй код на потенциальные баги, утечки памяти и проблемы с производительностью'
  },
  {
    icon: Zap,
    text: 'Оптимизируй производительность',
    prompt:
      'Проанализируй проект и предложи конкретные оптимизации производительности'
  }
]

export function WelcomeScreen({ projectName, onSuggestion }: WelcomeScreenProps): JSX.Element {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-1 flex-col items-center justify-center gap-6 px-4"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5">
        <Sparkles className="h-8 w-8 text-primary" />
      </div>

      <div className="text-center">
        <h2 className="text-lg font-semibold">
          {projectName ? `Работаем с ${projectName}` : 'Добро пожаловать'}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">Чем могу помочь?</p>
      </div>

      <div className="grid w-full max-w-md grid-cols-2 gap-2">
        {suggestions.map(({ icon: Icon, text, prompt }) => (
          <motion.button
            key={text}
            whileHover={{ y: -1 }}
            onClick={() => onSuggestion(prompt)}
            className="flex items-center gap-2.5 rounded-xl border border-border/60 p-3 text-left transition-colors hover:border-primary/20 hover:bg-accent/50"
          >
            <Icon className="h-4 w-4 shrink-0 text-primary" />
            <span className="text-sm">{text}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  )
}
