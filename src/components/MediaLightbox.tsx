import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { resolveMediaUrl } from '../api/postsApi'
import type { PostMediaItem } from '../api/postsApi'

interface MediaLightboxProps {
  media: PostMediaItem[]
  initialIndex: number
  onClose: () => void
}

export function MediaLightbox({ media, initialIndex, onClose }: MediaLightboxProps) {
  const [index, setIndex] = useState(initialIndex)

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1))
      if (e.key === 'ArrowRight') setIndex((i) => Math.min(media.length - 1, i + 1))
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [media.length, onClose])

  const current = media[index]
  if (!current) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 cursor-pointer"
      onClick={onClose}
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute right-4 top-4 rounded-full bg-surface/80 p-2 text-text cursor-pointer"
      >
        <X className="h-5 w-5" aria-hidden="true" />
      </button>

      {index > 0 && (
        <button
          type="button"
          aria-label="Previous image"
          onClick={(e) => {
            e.stopPropagation()
            setIndex((i) => Math.max(0, i - 1))
          }}
          className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-surface/80 p-2 text-text cursor-pointer"
        >
          <ChevronLeft className="h-6 w-6" aria-hidden="true" />
        </button>
      )}
      {index < media.length - 1 && (
        <button
          type="button"
          aria-label="Next image"
          onClick={(e) => {
            e.stopPropagation()
            setIndex((i) => Math.min(media.length - 1, i + 1))
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-surface/80 p-2 text-text cursor-pointer"
        >
          <ChevronRight className="h-6 w-6" aria-hidden="true" />
        </button>
      )}

      <div className="max-h-full max-w-full cursor-default" onClick={(e) => e.stopPropagation()}>
        {current.mediaType === 'Video' ? (
          <video
            src={resolveMediaUrl(current.url)!}
            controls
            autoPlay
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
          />
        ) : (
          <img
            src={resolveMediaUrl(current.url)!}
            alt="Post media"
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
          />
        )}
      </div>

      {media.length > 1 && (
        <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-1.5">
          {media.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 w-1.5 rounded-full transition-colors ${i === index ? 'bg-white' : 'bg-white/40'}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
