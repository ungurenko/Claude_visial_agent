import { useState, useCallback, useMemo, useEffect } from 'react'

export function useProject() {
  const [projectDir, setProjectDir] = useState<string | null>(null)
  const [initialized, setInitialized] = useState(false)

  // Load last project dir from settings on mount
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const saved = (await window.settings.get('lastProjectDir')) as string | null
      if (cancelled) return
      if (saved) {
        const exists = await window.fs.pathExists(saved)
        if (!cancelled && exists) {
          setProjectDir(saved)
        }
      }
      setInitialized(true)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  // Persist project dir changes
  useEffect(() => {
    if (!initialized) return
    window.settings.set('lastProjectDir', projectDir)
  }, [projectDir, initialized])

  const selectProject = useCallback(async () => {
    const dir = await window.dialog.selectFolder()
    if (dir) {
      setProjectDir(dir)
    }
  }, [])

  const projectName = useMemo(() => {
    if (!projectDir) return null
    return projectDir.split('/').pop() || projectDir
  }, [projectDir])

  return {
    projectDir,
    projectName,
    selectProject,
    setProjectDir,
    initialized
  }
}
