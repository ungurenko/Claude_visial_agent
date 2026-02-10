// Content block types from Claude API
export interface TextBlock {
  type: 'text'
  text: string
}

export interface ToolUseBlock {
  type: 'tool_use'
  id: string
  name: string
  input: Record<string, unknown>
}

export interface ToolResultBlock {
  type: 'tool_result'
  tool_use_id: string
  content: string
}

export type ContentBlock = TextBlock | ToolUseBlock | ToolResultBlock

// Claude Code stream-json events
export interface SystemInitEvent {
  type: 'system'
  subtype: 'init'
  session_id: string
  tools: string[]
  model: string
}

export interface AssistantMessageEvent {
  type: 'assistant'
  message: {
    id: string
    type: 'message'
    role: 'assistant'
    content: ContentBlock[]
    model: string
    stop_reason: string | null
  }
  parent_tool_use_id?: string
}

export interface UserMessageEvent {
  type: 'user'
  message: {
    role: 'user'
    content: ContentBlock[]
  }
}

export interface ResultEvent {
  type: 'result'
  subtype: 'success' | 'error_max_turns' | 'error_during_execution'
  result: string
  session_id: string
  total_cost_usd: number
  total_duration_ms: number
  total_duration_api_ms: number
}

export type ClaudeEvent = SystemInitEvent | AssistantMessageEvent | UserMessageEvent | ResultEvent

// Attached image
export interface AttachedImage {
  id: string
  path: string
  name: string
  type: 'file' | 'clipboard'
}

// UI-specific types
export type MessageRole = 'user' | 'assistant'

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  toolUse?: ToolUseInfo[]
  attachedImages?: AttachedImage[]
  timestamp: Date
  isStreaming?: boolean
}

export interface ToolUseInfo {
  id: string
  name: string
  input: Record<string, unknown>
  result?: string
  status: 'running' | 'done' | 'error'
}

export type SessionStatus = 'idle' | 'thinking' | 'executing' | 'done' | 'error'

export type ModelAlias = 'sonnet' | 'opus' | 'haiku'

export interface SessionInfo {
  id: string
  name: string
  projectDir: string
  messages: ChatMessage[]
  totalCost: number
  createdAt: Date
}
