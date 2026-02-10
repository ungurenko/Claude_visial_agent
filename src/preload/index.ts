import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const claudeAPI = {
  execute: (prompt: string, cwd: string, sessionId?: string, model?: string): void => {
    ipcRenderer.send('claude:execute', { prompt, cwd, sessionId, model })
  },
  stop: (): void => {
    ipcRenderer.send('claude:stop')
  },
  onEvent: (callback: (event: unknown) => void): (() => void) => {
    const handler = (_: unknown, data: unknown): void => {
      callback(data)
    }
    ipcRenderer.on('claude:event', handler)
    return () => ipcRenderer.removeListener('claude:event', handler)
  },
  onError: (callback: (error: string) => void): (() => void) => {
    const handler = (_: unknown, data: string): void => {
      callback(data)
    }
    ipcRenderer.on('claude:error', handler)
    return () => ipcRenderer.removeListener('claude:error', handler)
  },
  onComplete: (callback: (result: unknown) => void): (() => void) => {
    const handler = (_: unknown, data: unknown): void => {
      callback(data)
    }
    ipcRenderer.on('claude:complete', handler)
    return () => ipcRenderer.removeListener('claude:complete', handler)
  }
}

const dialogAPI = {
  selectFolder: (): Promise<string | null> => {
    return ipcRenderer.invoke('dialog:selectFolder')
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('claude', claudeAPI)
    contextBridge.exposeInMainWorld('dialog', dialogAPI)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore
  window.electron = electronAPI
  // @ts-ignore
  window.claude = claudeAPI
  // @ts-ignore
  window.dialog = dialogAPI
}
