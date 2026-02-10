import { createHighlighter, type Highlighter } from 'shiki'

let highlighterPromise: Promise<Highlighter> | null = null

export function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ['github-light', 'github-dark'],
      langs: [
        'javascript',
        'typescript',
        'tsx',
        'jsx',
        'python',
        'rust',
        'go',
        'json',
        'yaml',
        'html',
        'css',
        'bash',
        'sql',
        'markdown',
        'diff',
        'dockerfile'
      ]
    })
  }
  return highlighterPromise
}
