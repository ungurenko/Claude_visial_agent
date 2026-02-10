import { spawn, ChildProcess, execSync } from 'child_process'
import { createInterface } from 'readline'

type EventCallback = (event: Record<string, unknown>) => void
type ErrorCallback = (error: string) => void
type CompleteCallback = (lastEvent: Record<string, unknown> | null) => void

export class ClaudeManager {
  private currentProcess: ChildProcess | null = null
  private eventCallback: EventCallback = () => {}
  private errorCallback: ErrorCallback = () => {}
  private completeCallback: CompleteCallback = () => {}
  private claudeBinaryPath: string

  constructor() {
    this.claudeBinaryPath = this.resolveClaudePath()
  }

  private resolveClaudePath(): string {
    try {
      const result = execSync('which claude', { encoding: 'utf-8' }).trim()
      if (result) return result
    } catch {
      // which failed, fall back to default
    }
    return 'claude'
  }

  execute(prompt: string, cwd: string, sessionId?: string, model?: string): void {
    // Kill any running process before starting a new one
    if (this.currentProcess) {
      this.stop()
    }

    const args: string[] = [
      '-p',
      prompt,
      '--output-format',
      'stream-json',
      '--verbose',
      '--include-partial-messages'
    ]

    if (sessionId) {
      args.push('--session-id', sessionId)
    }

    if (model) {
      args.push('--model', model)
    }

    const child = spawn(this.claudeBinaryPath, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      cwd: cwd || undefined,
      env: { ...process.env }
    })

    this.currentProcess = child

    let lastEvent: Record<string, unknown> | null = null

    // Read stdout line by line (NDJSON)
    if (child.stdout) {
      const rl = createInterface({ input: child.stdout })
      rl.on('line', (line: string) => {
        const trimmed = line.trim()
        if (!trimmed) return

        try {
          const parsed = JSON.parse(trimmed) as Record<string, unknown>
          lastEvent = parsed
          this.eventCallback(parsed)
        } catch {
          // Non-JSON line, ignore
        }
      })
    }

    // Handle stderr
    if (child.stderr) {
      child.stderr.on('data', (data: Buffer) => {
        const text = data.toString()
        if (text.trim()) {
          this.errorCallback(text)
        }
      })
    }

    // Handle process exit
    child.on('close', () => {
      this.currentProcess = null
      this.completeCallback(lastEvent)
    })

    child.on('error', (err: Error) => {
      this.currentProcess = null
      this.errorCallback(`Failed to start claude process: ${err.message}`)
      this.completeCallback(null)
    })
  }

  stop(): void {
    if (this.currentProcess) {
      this.currentProcess.kill('SIGTERM')
      this.currentProcess = null
    }
  }

  onEvent(callback: EventCallback): void {
    this.eventCallback = callback
  }

  onError(callback: ErrorCallback): void {
    this.errorCallback = callback
  }

  onComplete(callback: CompleteCallback): void {
    this.completeCallback = callback
  }

  get isRunning(): boolean {
    return this.currentProcess !== null
  }
}
