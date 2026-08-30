import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { resolveMediaUrl } from '../api/postsApi'
import type { PostMediaItem } from '../api/postsApi'
import { useBodyScrollLock } from '../lib/useBodyScrollLock'
import { useOverlayDismiss } from '../lib/useOverlayDismiss'

interface MediaLightboxProps {
  media: PostMediaItem[]
  initialIndex: number
  onClose: () => void
}

export function MediaLightbox({ media, initialIndex, onClose }: MediaLightboxProps) {
  const { t } = useTranslation('componentsA')
  const [index, setIndex] = useState(initialIndex)

  useBodyScrollLock()
  const { backdropProps } = useOverlayDismiss({ onDismiss: onClose })

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1))
      if (e.key === 'ArrowRight') setIndex((i) => Math.min(media.length - 1, i + 1))
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [media.length])

  const current = media[index]
  if (!current) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 cursor-pointer"
      {...backdropProps}
    >
      <button
        type="button"
        aria-label={t('mediaLightbox.close')}
        onClick={onClose}
        className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] rounded-full bg-surface/80 p-2 text-text cursor-pointer"
      >
        <X className="h-5 w-5" aria-hidden="true" />
      </button>

      {index > 0 && (
        <button
          type="button"
          aria-label={t('mediaLightbox.previousImageAriaLabel')}
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
          aria-label={t('mediaLightbox.nextImageAriaLabel')}
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
            className="max-h-[85dvh] max-w-[90vw] rounded-lg object-contain"
          />
        ) : (
          <img
            src={resolveMediaUrl(current.url)!}
            alt={t('mediaLightbox.postMediaAlt')}
            className="max-h-[85dvh] max-w-[90vw] rounded-lg object-contain"
          />
        )}
      </div>

      {media.length > 1 && (
        <div className="absolute bottom-[max(1.5rem,env(safe-area-inset-bottom))] left-1/2 flex -translate-x-1/2 gap-1.5">
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
