import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Avatar } from './ui/Avatar'
import { Camera } from 'lucide-react'
import { usePasteImage } from '../lib/usePasteImage'

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif']
const MAX_BYTES = 10 * 1024 * 1024

export function validateAvatarFile(file: File, t?: (key: string) => string): string | null {
  const translate = t ?? ((key: string) => key)
  const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return translate('avatarUploadInput.unsupportedFileType')
  }
  if (file.size > MAX_BYTES) {
    return translate('avatarUploadInput.fileTooLarge')
  }
  return null
}

interface AvatarUploadInputProps {
  currentAvatarUrl?: string | null
  displayName: string
  file: File | null
  onFileChange: (file: File | null) => void
  error?: string | null
  onError?: (message: string | null) => void
}

export function AvatarUploadInput({
  currentAvatarUrl,
  displayName,
  file,
  onFileChange,
  error = null,
  onError,
}: AvatarUploadInputProps) {
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

  const { bindings } = usePasteImage((pastedFile) => handleFileSelected(pastedFile))

  return (
    <div className="flex flex-col gap-2">
      <label className="group relative w-fit cursor-pointer" {...bindings}>
        <Avatar src={previewUrl ?? currentAvatarUrl ?? undefined} alt={displayName} size="xl" />
        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
          <Camera className="h-6 w-6 text-white" aria-hidden="true" />
        </span>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          aria-label={t('avatarUploadInput.uploadAvatarAriaLabel')}
          className="hidden"
          onChange={(e) => handleFileSelected(e.target.files?.[0] ?? null)}
        />
      </label>
      {error && <p className="text-frustrated text-xs">{error}</p>}
    </div>
  )
}
