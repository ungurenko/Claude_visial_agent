import { useCallback } from 'react'

export function useSettings() {
  const get = useCallback(async (key: string): Promise<unknown> => {
    return window.settings.get(key)
  }, [])

  const set = useCallback(async (key: string, value: unknown): Promise<void> => {
    return window.settings.set(key, value)
  }, [])

  return { get, set }
}
