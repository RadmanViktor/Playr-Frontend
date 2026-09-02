import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X, Upload } from 'lucide-react'
import { validateMediaFile, isVideoFile } from './MediaUploadInput'
import type { PostMediaItem } from '../api/postsApi'
import { resolveMediaUrl } from '../api/postsApi'

export const MAX_MEDIA_COUNT = 5

interface ExistingMediaState extends PostMediaItem {
  markedForRemoval: boolean
}

interface MediaGalleryUploadInputProps {
  files: File[]
  onFilesChange: (files: File[]) => void
  existingMedia?: PostMediaItem[]
  removedExistingIds?: string[]
  onRemovedExistingIdsChange?: (ids: string[]) => void
  error?: string | null
  onError?: (message: string | null) => void
}

export function MediaGalleryUploadInput({
  files,
  onFilesChange,
  existingMedia = [],
  removedExistingIds = [],
  onRemovedExistingIdsChange,
  error = null,
  onError,
}: MediaGalleryUploadInputProps) {
  const { t } = useTranslation('componentsA')
  const inputRef = useRef<HTMLInputElement>(null)
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [isDragOver, setIsDragOver] = useState(false)

  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f))
    setPreviewUrls(urls)
    return () => urls.forEach((u) => URL.revokeObjectURL(u))
  }, [files])

  const visibleExisting: ExistingMediaState[] = existingMedia.map((m) => ({
    ...m,
    markedForRemoval: removedExistingIds.includes(m.id),
  }))
  const activeExistingCount = visibleExisting.filter((m) => !m.markedForRemoval).length
  const totalCount = activeExistingCount + files.length
  const hasVideo =
    files.some(isVideoFile) || visibleExisting.some((m) => !m.markedForRemoval && m.mediaType === 'Video')
  const remainingSlots = Math.max(0, MAX_MEDIA_COUNT - totalCount)

  function addFiles(selected: FileList | File[] | null) {
    if (!selected) return
    const incoming = Array.from(selected)
    if (incoming.length === 0) return

    if (hasVideo || files.some(isVideoFile)) {
      onError?.(t('mediaGalleryUploadInput.errors.singleVideoOnly'))
      return
    }

    const incomingHasVideo = incoming.some(isVideoFile)
    if (incomingHasVideo && (incoming.length > 1 || totalCount > 0)) {
      onError?.(t('mediaGalleryUploadInput.errors.singleVideoOnlyNotBoth'))
      return
    }

    for (const file of incoming) {
      const validationError = validateMediaFile(file, t)
      if (validationError) {
        onError?.(validationError)
        return
      }
    }

    if (totalCount + incoming.length > MAX_MEDIA_COUNT) {
      onError?.(t('mediaGalleryUploadInput.errors.maxImages', { max: MAX_MEDIA_COUNT }))
      return
    }

    onError?.(null)
    onFilesChange([...files, ...incoming])
  }

  function removeNewFile(index: number) {
    onFilesChange(files.filter((_, i) => i !== index))
    onError?.(null)
  }

  function removeExisting(id: string) {
    onRemovedExistingIdsChange?.([...removedExistingIds, id])
  }

  function undoRemoveExisting(id: string) {
    onRemovedExistingIdsChange?.(removedExistingIds.filter((existingId) => existingId !== id))
  }

  const canAddMore = remainingSlots > 0 && !hasVideo

  return (
    <div className="flex flex-col gap-2">
      {(visibleExisting.length > 0 || files.length > 0) && (
        <div className="flex flex-wrap gap-2">
          {visibleExisting.map((media) => (
            <div key={media.id} className="relative h-24 w-24 shrink-0">
              {media.markedForRemoval ? (
                <div className="flex h-full w-full items-center justify-center rounded-lg border border-dashed border-border bg-surface-raised">
                  <button
                    type="button"
                    onClick={() => undoRemoveExisting(media.id)}
                    className="text-xs text-muted hover:text-text cursor-pointer underline"
                  >
                    {t('mediaGalleryUploadInput.undo')}
                  </button>
                </div>
              ) : (
                <>
                  {media.mediaType === 'Video' ? (
                    <video src={resolveMediaUrl(media.url)!} className="h-full w-full rounded-lg object-cover" />
                  ) : (
                    <img
                      src={resolveMediaUrl(media.url)!}
                      alt={t('mediaGalleryUploadInput.postMediaAlt')}
                      className="h-full w-full rounded-lg object-cover"
                    />
                  )}
                  <button
                    type="button"
                    aria-label={t('mediaGalleryUploadInput.removeMediaAriaLabel')}
                    onClick={() => removeExisting(media.id)}
                    className="absolute -right-2 -top-2 rounded-full bg-surface p-1 text-text shadow cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </>
              )}
            </div>
          ))}
          {files.map((file, index) => (
            <div key={`${file.name}-${index}`} className="relative h-24 w-24 shrink-0">
              {isVideoFile(file) ? (
                <video src={previewUrls[index]} className="h-full w-full rounded-lg object-cover" controls />
              ) : (
                <img
                  src={previewUrls[index]}
                  alt={t('mediaGalleryUploadInput.selectedPreviewAlt')}
                  className="h-full w-full rounded-lg object-cover"
                />
              )}
              <button
                type="button"
                aria-label={t('mediaGalleryUploadInput.removeSelectedFileAriaLabel')}
                onClick={() => removeNewFile(index)}
                className="absolute -right-2 -top-2 rounded-full bg-surface p-1 text-text shadow cursor-pointer"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      )}

      {canAddMore && (
        <>
          <button
            type="button"
            aria-label={t('mediaGalleryUploadInput.uploadAriaLabel')}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragOver(true)
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
              e.preventDefault()
              setIsDragOver(false)
              addFiles(e.dataTransfer.files)
            }}
            className={`flex min-h-28 w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-5 py-6 text-center text-sm outline-none transition-colors ${
              isDragOver
                ? 'border-primary bg-primary/10 text-text'
                : 'border-border bg-surface-raised/50 text-muted hover:border-primary/60 hover:bg-surface-raised hover:text-text focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30'
            }`}
          >
            <span className="rounded-full bg-primary/15 p-3 text-primary">
              <Upload className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="font-medium text-text">
              {totalCount === 0
                ? t('mediaGalleryUploadInput.addMediaLabel')
                : t('mediaGalleryUploadInput.addMoreLabel', { count: remainingSlots })}
            </span>
          </button>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            className="hidden"
            onChange={(e) => {
              addFiles(e.target.files)
              if (inputRef.current) inputRef.current.value = ''
            }}
          />
        </>
      )}
      {error && <p className="text-frustrated text-xs">{error}</p>}
    </div>
  )
}
