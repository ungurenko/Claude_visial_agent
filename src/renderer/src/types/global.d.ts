import type { AttachedImage } from './claude'

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
      selectImages: () => Promise<AttachedImage[] | null>
    }
    sessions: {
      save: (id: string, data: unknown) => Promise<void>
      load: (id: string) => Promise<unknown>
      list: () => Promise<unknown[]>
      delete: (id: string) => Promise<void>
      updateMeta: (id: string, updates: Record<string, unknown>) => Promise<void>
    }
    settings: {
      get: (key: string) => Promise<unknown>
      set: (key: string, value: unknown) => Promise<void>
    }
    fs: {
      pathExists: (path: string) => Promise<boolean>
      saveClipboardImage: (buffer: Uint8Array, ext: string) => Promise<AttachedImage>
      getImageDataUrl: (path: string) => Promise<string | null>
    }
  }
}
