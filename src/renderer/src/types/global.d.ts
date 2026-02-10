export {}

declare global {
  interface Window {
    claude: {
      execute: (prompt: string, cwd: string, sessionId?: string, model?: string) => void
      stop: () => void
      onEvent: (callback: (event: unknown) => void) => () => void
      onError: (callback: (error: string) => void) => () => void
      onComplete: (callback: (result: unknown) => void) => () => void
    }
    dialog: {
      selectFolder: () => Promise<string | null>
    }
  }
}
