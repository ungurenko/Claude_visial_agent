import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AttachedImage } from '@/types/claude'

interface ImagePreviewProps {
  images: AttachedImage[]
  onRemove?: (id: string) => void
  compact?: boolean
}

function ImageThumbnail({
  image,
  onRemove,
  compact
}: {
  image: AttachedImage
  onRemove?: (id: string) => void
  compact?: boolean
}): JSX.Element {
  const [dataUrl, setDataUrl] = useState<string | null>(null)
  const size = compact ? 60 : 80

  useEffect(() => {
    let cancelled = false
    window.fs.getImageDataUrl(image.path).then((url) => {
      if (!cancelled) setDataUrl(url)
    })
    return () => {
      cancelled = true
    }
  }, [image.path])

  return (
    <div className="group/thumb relative flex flex-col items-center gap-1" style={{ width: size }}>
      <div
        className="relative overflow-hidden rounded-lg border border-border/50 bg-muted"
        style={{ width: size, height: size }}
      >
        {dataUrl ? (
          <img
            src={dataUrl}
            alt={image.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
          </div>
        )}
        {onRemove && (
          <button
            onClick={() => onRemove(image.id)}
            className={cn(
              'absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center',
              'rounded-full bg-destructive text-destructive-foreground shadow-sm',
              'opacity-0 transition-opacity group-hover/thumb:opacity-100',
              'hover:bg-destructive/90'
            )}
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
      <span
        className="max-w-full truncate text-[10px] text-muted-foreground"
        title={image.name}
      >
        {image.name}
      </span>
    </div>
  )
}

export function ImagePreview({ images, onRemove, compact }: ImagePreviewProps): JSX.Element {
  return (
    <div className="flex flex-wrap gap-2">
      {images.map((image) => (
        <ImageThumbnail
          key={image.id}
          image={image}
          onRemove={onRemove}
          compact={compact}
        />
      ))}
    </div>
  )
}

export default ImagePreview
