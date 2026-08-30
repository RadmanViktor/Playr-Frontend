import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { resolveMediaUrl } from '../api/postsApi'
import type { PostMediaItem } from '../api/postsApi'
import { MediaLightbox } from './MediaLightbox'

interface PostMediaCarouselProps {
  media: PostMediaItem[]
}

export function PostMediaCarousel({ media }: PostMediaCarouselProps) {
  const { t } = useTranslation('componentsA')
  const [activeIndex, setActiveIndex] = useState(0)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  if (media.length === 0) return null

  if (media.length === 1) {
    const item = media[0]
    return (
      <>
        <button
          type="button"
          onClick={() => setLightboxIndex(0)}
          className="w-full cursor-pointer text-left"
          aria-label={t('postMediaCarousel.openMediaAriaLabel')}
        >
          {item.mediaType === 'Video' ? (
            <video src={resolveMediaUrl(item.url)!} controls className="max-h-96 w-full rounded-lg object-contain" />
          ) : (
            <img
              src={resolveMediaUrl(item.url)!}
              alt={t('postMediaCarousel.postMediaAlt')}
              className="max-h-96 w-full rounded-lg object-contain"
            />
          )}
        </button>
        {lightboxIndex !== null && (
          <MediaLightbox media={media} initialIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} />
        )}
      </>
    )
  }

  function scrollToIndex(index: number) {
    const container = scrollRef.current
    if (!container) return
    const clamped = Math.max(0, Math.min(media.length - 1, index))
    container.scrollTo({ left: clamped * container.clientWidth, behavior: 'smooth' })
    setActiveIndex(clamped)
  }

  function handleScroll() {
    const container = scrollRef.current
    if (!container || container.clientWidth === 0) return
    const index = Math.round(container.scrollLeft / container.clientWidth)
    setActiveIndex(index)
  }

  return (
    <div className="group relative">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex snap-x snap-mandatory overflow-x-auto rounded-lg scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {media.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setLightboxIndex(index)}
            className="w-full shrink-0 snap-center cursor-pointer text-left"
            aria-label={t('postMediaCarousel.openMediaAriaLabel')}
          >
            {item.mediaType === 'Video' ? (
              <video
                src={resolveMediaUrl(item.url)!}
                controls
                className="max-h-96 w-full rounded-lg object-contain"
              />
            ) : (
              <img
                src={resolveMediaUrl(item.url)!}
                alt={t('postMediaCarousel.postMediaAlt')}
                className="max-h-96 w-full rounded-lg object-contain"
              />
            )}
          </button>
        ))}
      </div>

      {activeIndex > 0 && (
        <button
          type="button"
          aria-label={t('postMediaCarousel.previousImageAriaLabel')}
          onClick={() => scrollToIndex(activeIndex - 1)}
          className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white opacity-0 transition-opacity cursor-pointer group-hover:opacity-100"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
      {activeIndex < media.length - 1 && (
        <button
          type="button"
          aria-label={t('postMediaCarousel.nextImageAriaLabel')}
          onClick={() => scrollToIndex(activeIndex + 1)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white opacity-0 transition-opacity cursor-pointer group-hover:opacity-100"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      )}

      <div className="absolute right-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-xs text-white">
        {t('postMediaCarousel.counter', { current: activeIndex + 1, total: media.length })}
      </div>

      <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
        {media.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 w-1.5 rounded-full transition-colors ${i === activeIndex ? 'bg-white' : 'bg-white/40'}`}
          />
        ))}
      </div>

      {lightboxIndex !== null && (
        <MediaLightbox media={media} initialIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} />
      )}
    </div>
  )
}
