import { ipcMain, dialog, BrowserWindow } from 'electron'
import { ClaudeManager } from './claude-manager'

const manager = new ClaudeManager()

export function registerIpcHandlers(mainWindow: BrowserWindow): void {
  // Execute claude CLI with prompt
  ipcMain.on(
    'claude:execute',
    (_event, payload: { prompt: string; cwd: string; sessionId?: string; model?: string }) => {
      const { prompt, cwd, sessionId, model } = payload

      manager.onEvent((data) => {
        if (!mainWindow.isDestroyed()) {
          mainWindow.webContents.send('claude:event', data)
        }
      })

      manager.onError((error) => {
        if (!mainWindow.isDestroyed()) {
          mainWindow.webContents.send('claude:error', error)
        }
      })

      manager.onComplete((lastEvent) => {
        if (!mainWindow.isDestroyed()) {
          mainWindow.webContents.send('claude:complete', lastEvent)
        }
      })

      manager.execute(prompt, cwd, sessionId, model)
    }
  )

  // Stop the running claude process
  ipcMain.on('claude:stop', () => {
    manager.stop()
  })

  // Open native folder selection dialog
  ipcMain.handle('dialog:selectFolder', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory', 'createDirectory']
    })

    if (result.canceled || result.filePaths.length === 0) {
      return null
    }

    return result.filePaths[0]
  })
}
