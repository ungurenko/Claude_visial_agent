import { FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ProjectSelectorProps {
  projectDir: string | null
  onSelectProject: (dir: string) => void
}

export function ProjectSelector({ projectDir, onSelectProject }: ProjectSelectorProps): JSX.Element {
  const projectName = projectDir ? projectDir.split('/').pop() || projectDir : null

  const handleClick = async (): Promise<void> => {
    const selected = await window.dialog.selectFolder()
    if (selected) {
      onSelectProject(selected)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="group gap-2 text-sm font-medium text-foreground/80 hover:text-foreground"
      onClick={handleClick}
    >
      <FolderOpen className="h-4 w-4 transition-transform group-hover:scale-110" />
      <span className="transition-colors">{projectName ?? 'Выберите проект'}</span>
    </Button>
  )
}

export default ProjectSelector
