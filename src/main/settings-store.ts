import { app } from 'electron'
import * as fs from 'fs'
import * as path from 'path'

type SettingsMap = Record<string, unknown>

function getSettingsPath(): string {
  const dir = path.join(app.getPath('home'), '.claude-visual-agent')
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  return path.join(dir, 'settings.json')
}

function loadAll(): SettingsMap {
  try {
    const p = getSettingsPath()
    if (!fs.existsSync(p)) return {}
    const raw = fs.readFileSync(p, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

function saveAll(data: SettingsMap): void {
  fs.writeFileSync(getSettingsPath(), JSON.stringify(data, null, 2), 'utf-8')
}

export function getSetting(key: string): unknown {
  const data = loadAll()
  return data[key] ?? null
}

export function setSetting(key: string, value: unknown): void {
  const data = loadAll()
  data[key] = value
  saveAll(data)
}
