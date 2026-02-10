# Claude Visual Agent

Визуальный GUI-интерфейс для Claude Code CLI на базе Electron.

![Claude Visual Agent](https://img.shields.io/badge/electron-33-blue)
![React](https://img.shields.io/badge/react-18-blue)
![TypeScript](https://img.shields.io/badge/typescript-5-blue)

## Особенности

- 💬 Чат-интерфейс для общения с Claude
- 🎨 Современный UI с тёмной темой и frosted glass эффектами
- 📁 Выбор проекта и модели Claude
- 🔧 Визуализация активности инструментов
- 💰 Отображение стоимости запросов
- 📝 Подсветка синтаксиса кода (Shiki)
- 💾 История сессий с группировкой по датам

## Технологии

- **Electron 33** — desktop framework
- **React 18** — UI library
- **TypeScript** — type safety
- **Tailwind CSS 3** — styling
- **shadcn/ui** — UI components (new-york theme)
- **electron-vite** — build tool
- **motion/react** — animations
- **Shiki** — syntax highlighting

## Установка

```bash
npm install
```

## Запуск

```bash
# Development mode
npm run dev

# Build
npm run build

# Preview production build
npm run preview
```

## Структура проекта

```
src/
├── main/           # Electron main process
│   ├── index.ts           # Entry point
│   ├── claude-manager.ts  # Claude CLI process manager
│   └── ipc-handlers.ts    # IPC handlers
├── preload/        # Preload bridge
│   └── index.ts           # window.claude & window.dialog
└── renderer/       # React app
    ├── src/
    │   ├── components/    # UI components
    │   ├── hooks/         # React hooks
    │   ├── lib/           # Utilities
    │   └── types/         # TypeScript types
    └── index.html
```

## Архитектура

### IPC Communication

- **main → renderer**: через `webContents.send()`
- **renderer → main**: через `ipcRenderer.invoke()`

### Claude CLI Integration

Запускает `claude` с флагами `--output-format stream-json --verbose --include-partial-messages`, парсит NDJSON-стрим из stdout.

### Типы событий

- `system` — инициализация, session_id
- `assistant` — текст и tool_use блоки от Claude
- `user` — результаты выполнения инструментов
- `result` — итоговая стоимость и статистика

## Дизайн

Приложение использует macOS-стиль с нативным title bar (`hiddenInset`), frosted glass эффектами и тёмной темой. Цветовая схема основана на тёплом blue-gray (hue: 220deg) вместо чистого серого.

## Лицензия

MIT
