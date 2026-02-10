import { useState, useCallback, useMemo } from 'react'

export function useProject() {
  const [projectDir, setProjectDir] = useState<string | null>(null)

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
    setProjectDir
  }
}
