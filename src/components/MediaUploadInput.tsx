import { useEffect, useRef, useState } from 'react'
import { X, Upload } from 'lucide-react'

const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif']
const ALLOWED_VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov']
const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const MAX_VIDEO_BYTES = 100 * 1024 * 1024

export function validateMediaFile(file: File): string | null {
  const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()

  if (ALLOWED_IMAGE_EXTENSIONS.includes(extension)) {
    if (file.size > MAX_IMAGE_BYTES) return 'Images cannot be larger than 10 MB.'
    return null
  }

  if (ALLOWED_VIDEO_EXTENSIONS.includes(extension)) {
    if (file.size > MAX_VIDEO_BYTES) return 'Videos cannot be larger than 100 MB.'
    return null
  }

  return 'Unsupported file type. Allowed: jpg, jpeg, png, webp, gif, mp4, webm, mov.'
}

export function isVideoFile(file: File): boolean {
  const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
  return ALLOWED_VIDEO_EXTENSIONS.includes(extension)
}

interface MediaUploadInputProps {
  file: File | null
  onFileChange: (file: File | null) => void
  existingMediaUrl?: string | null
  existingMediaType?: string | null
  removeExisting?: boolean
  onRemoveExistingChange?: (remove: boolean) => void
  error?: string | null
  onError?: (message: string | null) => void
}

export function MediaUploadInput({
  file,
  onFileChange,
  existingMediaUrl = null,
  existingMediaType = null,
  removeExisting = false,
  onRemoveExistingChange,
  error = null,
  onError,
}: MediaUploadInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)

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
    const validationError = validateMediaFile(selected)
    if (validationError) {
      onError?.(validationError)
      onFileChange(null)
      return
    }
    onError?.(null)
    onFileChange(selected)
  }

  function clearFile() {
    onFileChange(null)
    onError?.(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const showExisting = !file && existingMediaUrl && !removeExisting

  return (
    <div className="flex flex-col gap-2">
      {file && previewUrl ? (
        <div className="relative w-fit">
          {isVideoFile(file) ? (
            <video src={previewUrl} controls className="max-h-64 rounded-lg" />
          ) : (
            <img src={previewUrl} alt="Selected media preview" className="max-h-64 rounded-lg" />
          )}
          <button
            type="button"
            aria-label="Remove selected file"
            onClick={clearFile}
            className="absolute -right-2 -top-2 rounded-full bg-surface p-1 text-text shadow cursor-pointer"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      ) : showExisting ? (
        <div className="relative w-fit">
          {existingMediaType === 'Video' ? (
            <video src={existingMediaUrl!} controls className="max-h-64 rounded-lg" />
          ) : (
            <img src={existingMediaUrl!} alt="Post media" className="max-h-64 rounded-lg" />
          )}
          <button
            type="button"
            aria-label="Remove media"
            onClick={() => onRemoveExistingChange?.(true)}
            className="absolute -right-2 -top-2 rounded-full bg-surface p-1 text-text shadow cursor-pointer"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      ) : (
        <label
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragOver(true)
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setIsDragOver(false)
            onRemoveExistingChange?.(false)
            handleFileSelected(e.dataTransfer.files?.[0] ?? null)
          }}
          className={`flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-sm transition-colors ${
            isDragOver ? 'border-primary text-text bg-surface-raised' : 'border-border text-muted hover:text-text'
          }`}
        >
          <Upload className="h-4 w-4" aria-hidden="true" />
          Add photo or video, or drag & drop
          <input
            ref={inputRef}
            type="file"
            accept="image/*,video/*"
            aria-label="Upload photo or video"
            className="hidden"
            onChange={(e) => {
              onRemoveExistingChange?.(false)
              handleFileSelected(e.target.files?.[0] ?? null)
            }}
          />
        </label>
      )}
      {error && <p className="text-frustrated text-xs">{error}</p>}
    </div>
  )
}
