import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Camera } from 'lucide-react'
import { resolveMediaUrl } from '../api/http'
import { validateAvatarFile } from './AvatarUploadInput'
import { usePasteImage } from '../lib/usePasteImage'

interface CoverImageUploadInputProps {
  currentCoverImageUrl?: string | null
  file: File | null
  onFileChange: (file: File | null) => void
  error?: string | null
  onError?: (message: string | null) => void
  positionX?: number
  positionY?: number
  onPositionChange?: (positionX: number, positionY: number) => void
}

function clampPercent(value: number) {
  return Math.min(100, Math.max(0, value))
}

export function CoverImageUploadInput({
  currentCoverImageUrl,
  file,
  onFileChange,
  error = null,
  onError,
  positionX = 50,
  positionY = 50,
  onPositionChange,
}: CoverImageUploadInputProps) {
  const { t } = useTranslation('componentsB')
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragState = useRef<{ lastX: number; lastY: number } | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  function handleFileSelected(selected: File | null) {
    if (!selected) {
      onFileChange(null)
      return
    }
    const validationError = validateAvatarFile(selected, t)
    if (validationError) {
      onError?.(validationError)
      onFileChange(null)
      return
    }
    onError?.(null)
    onFileChange(selected)
  }

  const backgroundUrl = previewUrl ?? resolveMediaUrl(currentCoverImageUrl ?? null)

  const { bindings } = usePasteImage((pastedFile) => handleFileSelected(pastedFile))

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (!backgroundUrl || !onPositionChange) return
    e.preventDefault()
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    dragState.current = { lastX: e.clientX, lastY: e.clientY }
    setIsDragging(true)
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragState.current || !onPositionChange || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const deltaX = e.clientX - dragState.current.lastX
    const deltaY = e.clientY - dragState.current.lastY
    dragState.current = { lastX: e.clientX, lastY: e.clientY }
    const nextX = clampPercent(positionX - (deltaX / rect.width) * 100)
    const nextY = clampPercent(positionY - (deltaY / rect.height) * 100)
    onPositionChange(nextX, nextY)
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (dragState.current) {
      ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
    }
    dragState.current = null
    setIsDragging(false)
  }

  return (
    <div className="flex flex-col gap-2">
      <div
        ref={containerRef}
        className={`group relative block h-28 w-full overflow-hidden rounded-xl border border-border bg-gradient-to-br from-primary/60 via-primary/25 to-surface bg-cover ${
          backgroundUrl && onPositionChange ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : ''
        }`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        {...bindings}
      >
        <span
          className="pointer-events-none absolute inset-0 bg-cover"
          style={
            backgroundUrl
              ? { backgroundImage: `url(${backgroundUrl})`, backgroundPosition: `${positionX}% ${positionY}%` }
              : undefined
          }
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100"
        >
          <Camera className="h-5 w-5" aria-hidden="true" />
          {t('coverImageUploadInput.change')}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          aria-label={t('coverImageUploadInput.uploadCoverImageAriaLabel')}
          className="hidden"
          onChange={(e) => handleFileSelected(e.target.files?.[0] ?? null)}
        />
      </div>
      {backgroundUrl && onPositionChange && (
        <p className="text-xs text-muted">{t('coverImageUploadInput.dragHint')}</p>
      )}
      {error && <p className="text-frustrated text-xs">{error}</p>}
    </div>
  )
}
