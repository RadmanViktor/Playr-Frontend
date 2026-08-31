import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Camera } from 'lucide-react'
import { resolveMediaUrl } from '../api/http'
import { validateAvatarFile } from './AvatarUploadInput'

interface CoverImageUploadInputProps {
  currentCoverImageUrl?: string | null
  file: File | null
  onFileChange: (file: File | null) => void
  error?: string | null
  onError?: (message: string | null) => void
}

export function CoverImageUploadInput({
  currentCoverImageUrl,
  file,
  onFileChange,
  error = null,
  onError,
}: CoverImageUploadInputProps) {
  const { t } = useTranslation('componentsB')
  const inputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

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

  return (
    <div className="flex flex-col gap-2">
      <label className="group relative block h-28 w-full cursor-pointer overflow-hidden rounded-xl border border-border bg-gradient-to-br from-primary/60 via-primary/25 to-surface bg-cover bg-center">
        <span
          className="absolute inset-0 bg-cover bg-center"
          style={backgroundUrl ? { backgroundImage: `url(${backgroundUrl})` } : undefined}
        />
        <span className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
          <Camera className="h-5 w-5" aria-hidden="true" />
          {t('coverImageUploadInput.change')}
        </span>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          aria-label={t('coverImageUploadInput.uploadCoverImageAriaLabel')}
          className="hidden"
          onChange={(e) => handleFileSelected(e.target.files?.[0] ?? null)}
        />
      </label>
      {error && <p className="text-frustrated text-xs">{error}</p>}
    </div>
  )
}
