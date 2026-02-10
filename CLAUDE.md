# Claude Visual Agent

Electron-приложение — визуальный GUI-wrapper для Claude Code CLI. Позволяет общаться с Claude через чат-интерфейс, выбирать проект и модель, видеть активность инструментов и стоимость. Поддерживает прикрепление изображений к сообщениям.

## Критические правила

- **НЕ трогай `node_modules/`** — только `npm install` для зависимостей
- **Preload bridge** — единственный мост между main и renderer. Новые IPC-каналы добавляются в 3 файла: `preload/index.ts`, `ipc-handlers.ts`, `types/global.d.ts`
- **contextIsolation: true** — прямой доступ к Node.js из renderer запрещён

## Команды

- `npm run dev` — запуск в dev-режиме (electron-vite dev)
- `npm run build` — сборка для продакшена
- `npm run preview` — превью собранного приложения

## Архитектура

| Путь | Назначение |
|------|------------|
| `src/main/index.ts` | Electron main process, создание BrowserWindow, cleanup temp-изображений |
| `src/main/claude-manager.ts` | Управление CLI-процессом Claude (spawn, NDJSON) |
| `src/main/ipc-handlers.ts` | IPC-обработчики: execute, stop, selectFolder, selectImages, saveClipboardImage, getImageDataUrl |
| `src/preload/index.ts` | Bridge: `window.claude`, `window.dialog`, `window.fs` |
| `src/renderer/src/App.tsx` | Корневой React-компонент |
| `src/renderer/src/hooks/` | `useClaude` (стрим сообщений + изображения), `useProject` (выбор папки) |
| `src/renderer/src/components/` | UI: Sidebar, ChatWindow, InputArea, MessageBubble, ImagePreview и др. |
| `src/renderer/src/types/claude.ts` | Типы: ClaudeEvent, ChatMessage, ToolUseInfo, AttachedImage |
| `src/renderer/src/types/global.d.ts` | Типы window.claude, window.dialog, window.fs |

## Ключевые паттерны

**IPC-коммуникация**: main → renderer через `webContents.send()`, renderer → main через `ipcRenderer.send()` / `ipcRenderer.invoke()`. События: `claude:event`, `claude:error`, `claude:complete`.

**Стриминг NDJSON**: `ClaudeManager.execute()` запускает `claude -p ... --output-format stream-json --verbose --include-partial-messages`, парсит построчно JSON из stdout.

**Типы событий CLI**: `system` (init, session_id), `assistant` (text + tool_use блоки), `user` (tool_result), `result` (итог, стоимость).

**Состояния сессии**: `idle` → `thinking` → `executing` → `done`/`error`.

**Обновление сообщений**: последнее assistant-сообщение с `isStreaming: true` обновляется in-place при новых событиях.

**Прикрепление изображений**: CLI не имеет флага `--image`, поэтому пути к изображениям добавляются в текст промпта (`Attached images:\nImage 1: /path/to/file`). Claude Code прочитает их через свой инструмент Read. Clipboard-изображения сохраняются в `{temp}/claude-visual-agent-images/`, temp-папка очищается при запуске приложения.

## UI-компоненты

| Компонент | Файл | Роль |
|-----------|------|------|
| Sidebar | `Sidebar.tsx` | Навигация, кнопка "Новый чат" |
| ChatWindow | `ChatWindow.tsx` | Список сообщений, автоскролл |
| MessageBubble | `MessageBubble.tsx` | Рендер markdown + превью прикреплённых изображений |
| InputArea | `InputArea.tsx` | Textarea, кнопка-скрепка, Cmd+V paste изображений |
| ImagePreview | `ImagePreview.tsx` | Миниатюры прикреплённых изображений с кнопкой удаления |
| ToolActivity | `ToolActivity.tsx` | Показ активных инструментов Claude |
| StatusBar | `StatusBar.tsx` | Статус, стоимость |
| ProjectSelector | `ProjectSelector.tsx` | Выбор рабочей папки через нативный диалог |
| ModelSelector | `ModelSelector.tsx` | Выбор модели: Sonnet/Opus/Haiku |

## IPC-каналы для изображений

| Канал | Тип | Назначение |
|-------|-----|------------|
| `dialog:selectImages` | `handle` | Нативный диалог выбора изображений (jpg, png, gif, webp, bmp) |
| `fs:saveClipboardImage` | `handle` | Сохранение Uint8Array из clipboard в temp-файл |
| `fs:getImageDataUrl` | `handle` | Чтение файла и возврат `data:image/...;base64,...` для превью |

## Tech Stack

Electron 33 + electron-vite + React 18 + TypeScript + Tailwind CSS 3 + shadcn/ui (new-york) + react-markdown + lucide-react

## Окно приложения

- `titleBarStyle: 'hiddenInset'` — нативный macOS title bar
- Traffic light position: `{ x: 15, y: 15 }`
- Sidebar и header имеют `paddingTop: 38px` для traffic light buttons
- Body: `webkit-app-region: drag`, интерактивные элементы: `no-drag`

## Добавление нового IPC-канала

1. `src/main/ipc-handlers.ts` — добавить `ipcMain.on/handle`
2. `src/preload/index.ts` — добавить метод в соответствующий API-объект
3. `src/renderer/src/types/global.d.ts` — добавить тип в `Window`
