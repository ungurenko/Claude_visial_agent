import { useEffect } from 'react'

interface ShortcutHandlers {
  onNewChat: () => void
  onToggleSidebar: () => void
  onFocusInput: () => void
  onSelectProject: () => void
  onStopGeneration: () => void
  isProcessing: boolean
}

export function useKeyboardShortcuts({
  onNewChat,
  onToggleSidebar,
  onFocusInput,
  onSelectProject,
  onStopGeneration,
  isProcessing
}: ShortcutHandlers): void {
  useEffect(() => {
    const handler = (e: KeyboardEvent): void => {
      const meta = e.metaKey || e.ctrlKey

      if (meta && e.key === 'n') {
        e.preventDefault()
        onNewChat()
        return
      }

      if (meta && e.key === 'b') {
        e.preventDefault()
        onToggleSidebar()
        return
      }

      if (meta && e.key === 'l') {
        e.preventDefault()
        onFocusInput()
        return
      }

      if (meta && e.key === 'o') {
        e.preventDefault()
        onSelectProject()
        return
      }

      if (e.key === 'Escape' && isProcessing) {
        e.preventDefault()
        onStopGeneration()
        return
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onNewChat, onToggleSidebar, onFocusInput, onSelectProject, onStopGeneration, isProcessing])
}
