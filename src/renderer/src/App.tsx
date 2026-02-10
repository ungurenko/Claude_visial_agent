import { useState, useCallback } from 'react'
import { LayoutGroup } from 'motion/react'
import { useClaude } from '@/hooks/useClaude'
import { useProject } from '@/hooks/useProject'
import { useTheme } from '@/hooks/useTheme'
import { useSessions } from '@/hooks/useSessions'
import { Sidebar } from '@/components/Sidebar'
import { ProjectSelector } from '@/components/ProjectSelector'
import { ModelSelector } from '@/components/ModelSelector'
import { ChatWindow } from '@/components/ChatWindow'
import { InputArea } from '@/components/InputArea'
import { ToolActivity } from '@/components/ToolActivity'
import { StatusBar } from '@/components/StatusBar'
import type { ModelAlias } from '@/types/claude'

export function App(): JSX.Element {
  const { messages, status, totalCost, currentTools, sendMessage, stopGeneration, switchSession, removeSessionCache } =
    useClaude()
  const { projectDir, projectName, setProjectDir } = useProject()
  const { theme, setTheme } = useTheme()
  const { sessions, activeSessionId, addSession, updateSession, removeSession, selectSession } =
    useSessions()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [model, setModel] = useState<ModelAlias>(
    () => (localStorage.getItem('claude-model') as ModelAlias) || 'sonnet'
  )

  const handleModelChange = useCallback((newModel: ModelAlias) => {
    setModel(newModel)
    localStorage.setItem('claude-model', newModel)
  }, [])

  const handleSend = useCallback(
    (text: string) => {
      if (!projectDir) return

      // Create session if none active
      if (!activeSessionId) {
        const sessionId = crypto.randomUUID()
        addSession({
          id: sessionId,
          title: text.length > 40 ? text.slice(0, 40) + '...' : text,
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

      sendMessage(text, projectDir, model)
    },
    [projectDir, sendMessage, model, activeSessionId, addSession, updateSession, switchSession, projectName, messages.length, totalCost]
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

  const isProcessing = status === 'thinking' || status === 'executing'

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
