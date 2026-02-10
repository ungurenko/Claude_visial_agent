import { useState, useCallback, useEffect } from 'react'
import { LayoutGroup } from 'motion/react'
import { useClaude } from '@/hooks/useClaude'
import { useProject } from '@/hooks/useProject'
import { useTheme } from '@/hooks/useTheme'
import { useSessions } from '@/hooks/useSessions'
import { useOnboarding } from '@/hooks/useOnboarding'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { Sidebar } from '@/components/Sidebar'
import { ProjectSelector } from '@/components/ProjectSelector'
import { ModelSelector } from '@/components/ModelSelector'
import { ChatWindow } from '@/components/ChatWindow'
import { InputArea } from '@/components/InputArea'
import { ToolActivity } from '@/components/ToolActivity'
import { StatusBar } from '@/components/StatusBar'
import type { ModelAlias, AttachedImage } from '@/types/claude'

export function App(): JSX.Element {
  const { messages, status, totalCost, currentTools, sendMessage, stopGeneration, switchSession, removeSessionCache, resetStatusToIdle } =
    useClaude()
  const { projectDir, projectName, selectProject, setProjectDir } = useProject()
  const { theme, setTheme } = useTheme()
  const { sessions, activeSessionId, addSession, updateSession, removeSession, selectSession } =
    useSessions()
  const { onboardingDone, completeOnboarding } = useOnboarding()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [model, setModel] = useState<ModelAlias>(
    () => (localStorage.getItem('claude-model') as ModelAlias) || 'sonnet'
  )
  const handleModelChange = useCallback((newModel: ModelAlias) => {
    setModel(newModel)
    localStorage.setItem('claude-model', newModel)
  }, [])

  const handleSend = useCallback(
    (text: string, images: AttachedImage[] = []) => {
      if (!projectDir) return

      // Complete onboarding on first message
      if (!onboardingDone) {
        completeOnboarding()
      }

      // Create session if none active
      if (!activeSessionId) {
        const sessionId = crypto.randomUUID()
        const title = text || 'Image attachment'
        addSession({
          id: sessionId,
          title: title.length > 40 ? title.slice(0, 40) + '...' : title,
          projectName: projectName || 'Unknown',
          messageCount: 1,
          totalCost: 0,
          createdAt: Date.now(),
          updatedAt: Date.now()
        })
        switchSession(sessionId)
      } else {
        updateSession(activeSessionId, {
          messageCount: messages.length + 1,
          totalCost
        })
      }

      sendMessage(text, projectDir, images.length > 0 ? images : undefined, model)
    },
    [projectDir, sendMessage, model, activeSessionId, addSession, updateSession, switchSession, projectName, messages.length, totalCost, onboardingDone, completeOnboarding]
  )

  const handleSuggestion = useCallback(
    (text: string) => {
      if (!projectDir) return
      handleSend(text)
    },
    [projectDir, handleSend]
  )

  const handleNewChat = useCallback(() => {
    switchSession(null)
    selectSession(null)
  }, [switchSession, selectSession])

  const handleSelectSession = useCallback((id: string | null) => {
    switchSession(id)
    selectSession(id)
  }, [switchSession, selectSession])

  const handleDeleteSession = useCallback((id: string) => {
    removeSessionCache(id)
    removeSession(id)
  }, [removeSessionCache, removeSession])

  const handleRenameSession = useCallback((id: string, title: string) => {
    updateSession(id, { title })
  }, [updateSession])

  const isProcessing = status === 'thinking' || status === 'executing'

  // Auto-reset done → idle after 3 seconds
  useEffect(() => {
    if (status !== 'done') return
    const timer = setTimeout(resetStatusToIdle, 3000)
    return () => clearTimeout(timer)
  }, [status, resetStatusToIdle])

  // Auto-collapse sidebar on narrow window
  useEffect(() => {
    const handleResize = (): void => {
      if (window.innerWidth < 900) {
        setSidebarCollapsed(true)
      }
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onNewChat: handleNewChat,
    onToggleSidebar: () => setSidebarCollapsed((prev) => !prev),
    onFocusInput: () => {
      const textarea = document.querySelector('textarea')
      textarea?.focus()
    },
    onSelectProject: selectProject,
    onStopGeneration: stopGeneration,
    isProcessing
  })

  const showOnboarding = !projectDir && !onboardingDone

  return (
    <LayoutGroup>
      <div className="flex h-screen font-sans">
        {/* Sidebar */}
        <Sidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          collapsed={sidebarCollapsed}
          projectDir={projectDir}
          onNewChat={handleNewChat}
          onSelectSession={handleSelectSession}
          onDeleteSession={handleDeleteSession}
          onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
          onRenameSession={handleRenameSession}
        />

        {/* Main content area */}
        <div className="flex flex-1 flex-col">
          {/* Header bar */}
          <header
            className="flex shrink-0 items-center glass border-b glass-border px-4"
            style={{ paddingTop: 38, minHeight: 38 + 48 }}
          >
            <ProjectSelector projectDir={projectDir} onSelectProject={setProjectDir} />
            <ModelSelector model={model} onChange={handleModelChange} />
          </header>

          {/* Chat area */}
          <div className="flex flex-1 flex-col min-h-0 overflow-hidden">
            <ChatWindow
              messages={messages}
              status={status}
              projectName={projectName}
              onSuggestion={handleSuggestion}
              showOnboarding={showOnboarding}
              onSelectProject={selectProject}
            />

            {/* Tool activity overlay */}
            {currentTools.length > 0 && (
              <div className="border-t glass-border px-4 py-2">
                <div className="mx-auto max-w-3xl">
                  <ToolActivity tools={currentTools} />
                </div>
              </div>
            )}

            {/* Input area */}
            <InputArea
              onSend={handleSend}
              disabled={!projectDir}
              isProcessing={isProcessing}
              onStop={stopGeneration}
              onSelectProject={selectProject}
            />
          </div>

          {/* Status bar */}
          <StatusBar
            status={status}
            totalCost={totalCost}
            model={model}
            theme={theme}
            onThemeChange={setTheme}
          />
        </div>
      </div>
    </LayoutGroup>
  )
}

export default App
