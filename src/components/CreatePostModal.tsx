import { useCallback, useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { Button } from './ui/Button'
import { MediaGalleryUploadInput } from './MediaGalleryUploadInput'
import { validateMediaFile } from './MediaUploadInput'
import { EmojiPickerButton } from './EmojiPickerButton'
import { GamePickerInput } from './GamePickerInput'
import { useAuth } from '../context/AuthContext'
import { getGames, type Game } from '../api/gamesApi'
import { createPost, type PostFeedItem } from '../api/postsApi'
import { ApiError } from '../api/http'
import { MOOD_OPTIONS, moodOptionToApi, type MoodOption } from '../lib/mood'
import { addRecentGameId } from '../lib/recentGames'
import { useBodyScrollLock } from '../lib/useBodyScrollLock'
import { useOverlayDismiss } from '../lib/useOverlayDismiss'

interface CreatePostModalProps {
  onClose: () => void
  onPostCreated: (post: PostFeedItem) => void
}

export function CreatePostModal({ onClose, onPostCreated }: CreatePostModalProps) {
  const { token } = useAuth()

  const [games, setGames] = useState<Game[]>([])
  const [gamesError, setGamesError] = useState<string | null>(null)
  const [gamesLoadKey, setGamesLoadKey] = useState(0)
  const [selectedGameId, setSelectedGameId] = useState('')
  const [selectedMood, setSelectedMood] = useState<MoodOption>('None')
  const [text, setText] = useState('')
  const [textError, setTextError] = useState<string | null>(null)
  const [mediaFiles, setMediaFiles] = useState<File[]>([])
  const [mediaError, setMediaError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [confirmingDiscard, setConfirmingDiscard] = useState(false)

  useEffect(() => {
    setGamesError(null)
    getGames()
      .then((g) => {
        setGames(g)
        if (g.length > 0) setSelectedGameId((current) => current || g[0].id)
      })
      .catch(() => setGamesError('Failed to load games.'))
  }, [gamesLoadKey])

  useEffect(() => {
    function handlePaste(e: ClipboardEvent) {
      const items = e.clipboardData?.items
      if (!items) return
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (!file) continue
          const validationError = validateMediaFile(file)
          if (validationError) {
            setMediaError(validationError)
          } else {
            setMediaError(null)
            setMediaFiles((current) => (current.length < 5 ? [...current, file] : current))
          }
          break
        }
      }
    }
    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [])

  const hasUnsavedContent = text.trim() !== '' || mediaFiles.length > 0

  const requestClose = useCallback(() => {
    if (hasUnsavedContent) {
      setConfirmingDiscard(true)
      return
    }
    onClose()
  }, [hasUnsavedContent, onClose])

  useBodyScrollLock()
  const { backdropProps } = useOverlayDismiss({ onDismiss: requestClose })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setTextError(null)
    setSubmitError(null)

    const trimmed = text.trim()
    if (!selectedGameId) { setSubmitError('Please select a game.'); return }
    if (!trimmed) { setTextError('Post text is required.'); return }
    if (trimmed.length > 1000) { setTextError('Post text cannot be longer than 1000 characters.'); return }

    setIsSubmitting(true)
    setUploadProgress(mediaFiles.length > 0 ? 0 : null)
    try {
      const post = await createPost(
        token!,
        { gameId: selectedGameId, textContent: trimmed, mood: moodOptionToApi(selectedMood), media: mediaFiles },
        mediaFiles.length > 0 ? setUploadProgress : undefined
      )
      addRecentGameId(selectedGameId)
      onPostCreated(post)
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : 'Something went wrong.')
    } finally {
      setIsSubmitting(false)
      setUploadProgress(null)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 cursor-pointer sm:items-center"
      {...backdropProps}
    >
      <div className="my-auto flex max-h-[90svh] w-full max-w-xl cursor-default flex-col overflow-y-auto overscroll-contain rounded-xl border border-border bg-surface p-5">
        <div className="sticky top-0 z-10 -mx-5 -mt-5 mb-4 flex items-center justify-between bg-surface px-5 pb-3 pt-5">
          <h2 className="text-lg font-semibold text-text">Create Post</h2>
          <button
            type="button"
            onClick={requestClose}
            aria-label="Close"
            className="rounded-lg p-1 text-muted hover:bg-surface-raised hover:text-text cursor-pointer"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {confirmingDiscard ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-text">Discard this post? Your text and media will be lost.</p>
            <div className="flex gap-2">
              <Button size="sm" className="bg-frustrated hover:bg-frustrated/80 shadow-none" onClick={onClose}>
                Discard
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirmingDiscard(false)}>
                Keep editing
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <label className="flex flex-col gap-1 text-sm text-muted">
              Game
              <GamePickerInput
                games={games}
                value={selectedGameId}
                onChange={setSelectedGameId}
                error={gamesError}
                onRetry={() => setGamesLoadKey((k) => k + 1)}
              />
            </label>

            <div className="flex flex-col gap-2">
              <span className="text-sm text-muted">Mood (optional)</span>
              <div className="flex flex-wrap gap-2">
                {MOOD_OPTIONS.map((mood) => (
                  <button
                    key={mood}
                    type="button"
                    aria-pressed={selectedMood === mood}
                    onClick={() => setSelectedMood(mood)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors cursor-pointer ${
                      selectedMood === mood
                        ? 'bg-primary text-white'
                        : 'bg-surface-raised text-muted hover:text-text'
                    }`}
                  >
                    {mood}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex flex-col gap-1 text-sm text-muted">
              What happened?
              <div className="relative">
                <textarea
                  aria-label="Post text"
                  className="w-full rounded-lg border border-border bg-surface-raised px-3 py-2 pr-10 text-text resize-none min-h-24 max-h-40 outline-none focus:border-primary"
                  value={text}
                  maxLength={1000}
                  onChange={(e) => setText(e.target.value)}
                />
                <div className="absolute bottom-2 right-2">
                  <EmojiPickerButton onSelect={(emoji) => setText((t) => t + emoji)} />
                </div>
              </div>
              <span className="text-xs text-muted self-end">{text.length} / 1000</span>
            </label>

            {textError && <p className="text-frustrated text-sm">{textError}</p>}

            <MediaGalleryUploadInput
              files={mediaFiles}
              onFilesChange={setMediaFiles}
              error={mediaError}
              onError={setMediaError}
            />

            {uploadProgress !== null && (
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-raised">
                <div
                  className="h-full rounded-full bg-primary transition-[width]"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}

            {submitError && <p className="text-frustrated text-sm">{submitError}</p>}

            <div className="sticky bottom-0 -mx-5 -mb-5 bg-surface px-5 pb-5 pt-3">
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? 'Posting…' : 'Post'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
