import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { Button } from './ui/Button'
import { MediaGalleryUploadInput } from './MediaGalleryUploadInput'
import { validateMediaFile } from './MediaUploadInput'
import { EmojiPickerButton } from './EmojiPickerButton'
import { GamePickerInput } from './GamePickerInput'
import { MentionInput, type MentionDraft } from './MentionInput'
import { useAuth } from '../context/AuthContext'
import type { Game } from '../api/gamesApi'
import { createPost, type PostFeedItem, type PostScope } from '../api/postsApi'
import { ApiError } from '../api/http'
import { MOOD_OPTIONS, moodOptionToApi, type MoodOption } from '../lib/mood'
import { useBodyScrollLock } from '../lib/useBodyScrollLock'
import { useOverlayDismiss } from '../lib/useOverlayDismiss'

function moodLabel(mood: string, t: (key: string) => string): string {
  switch (mood) {
    case 'Enjoying': return t('postCard.mood.enjoying')
    case 'Need Help': return t('postCard.mood.needHelp')
    case 'Frustrated': return t('postCard.mood.frustrated')
    case 'Completed': return t('postCard.mood.completed')
    default: return t('postCard.mood.none')
  }
}

interface CreatePostModalProps {
  scope?: PostScope
  onClose: () => void
  onPostCreated: (post: PostFeedItem) => void
}

export function CreatePostModal({ scope = 'Feed', onClose, onPostCreated }: CreatePostModalProps) {
  const { t } = useTranslation('componentsA')
  const { token } = useAuth()

  const [selectedGame, setSelectedGame] = useState<Game | null>(null)
  const [selectedMood, setSelectedMood] = useState<MoodOption>('None')
  const [text, setText] = useState('')
  const [mentions, setMentions] = useState<MentionDraft[]>([])
  const [textError, setTextError] = useState<string | null>(null)
  const [mediaFiles, setMediaFiles] = useState<File[]>([])
  const [mediaError, setMediaError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [confirmingDiscard, setConfirmingDiscard] = useState(false)

  useEffect(() => {
    function handlePaste(e: ClipboardEvent) {
      const items = e.clipboardData?.items
      if (!items) return
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (!file) continue
          const validationError = validateMediaFile(file, t)
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
    if (!selectedGame) { setSubmitError(t('createPostModal.errors.selectGame')); return }
    if (!trimmed) { setTextError(t('createPostModal.errors.textRequired')); return }
    if (trimmed.length > 1000) { setTextError(t('createPostModal.errors.textTooLong')); return }

    setIsSubmitting(true)
    setUploadProgress(mediaFiles.length > 0 ? 0 : null)
    try {
      const post = await createPost(
        token!,
        {
          gameId: selectedGame.id,
          textContent: trimmed,
          mood: moodOptionToApi(selectedMood),
          media: mediaFiles,
          mentionedUserIds: mentions.map((m) => m.userId),
          scope,
        },
        mediaFiles.length > 0 ? setUploadProgress : undefined
      )
      onPostCreated(post)
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : t('createPostModal.errors.genericError'))
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
          <h2 className="text-lg font-semibold text-text">{t(scope === 'Profile' ? 'createPostModal.titleProfile' : 'createPostModal.title')}</h2>
          <button
            type="button"
            onClick={requestClose}
            aria-label={t('createPostModal.close')}
            className="rounded-lg p-1 text-muted hover:bg-surface-raised hover:text-text cursor-pointer"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {confirmingDiscard ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-text">{t('createPostModal.discardConfirm')}</p>
            <div className="flex gap-2">
              <Button size="sm" className="bg-frustrated hover:bg-frustrated/80 shadow-none" onClick={onClose}>
                {t('createPostModal.discard')}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirmingDiscard(false)}>
                {t('createPostModal.keepEditing')}
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <label className="flex flex-col gap-1 text-sm text-muted">
              {t('createPostModal.gameLabel')}
              <GamePickerInput selectedGame={selectedGame} onSelect={setSelectedGame} />
            </label>

            <div className="flex flex-col gap-2">
              <span className="text-sm text-muted">{t('createPostModal.moodLabel')}</span>
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
                    {moodLabel(mood, t)}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex flex-col gap-1 text-sm text-muted">
              {t('createPostModal.textLabel')}
              <MentionInput
                ariaLabel={t('createPostModal.postTextAriaLabel')}
                className="w-full rounded-lg border border-border bg-surface-raised px-3 py-2 pr-10 text-text resize-none min-h-24 max-h-40 outline-none focus:border-primary"
                value={text}
                mentions={mentions}
                maxLength={1000}
                onChange={(value, nextMentions) => {
                  setText(value)
                  setMentions(nextMentions)
                }}
                rightSlot={
                  <div className="absolute bottom-2 right-2">
                    <EmojiPickerButton onSelect={(emoji) => setText((t) => t + emoji)} />
                  </div>
                }
              />
              <span className="text-xs text-muted self-end">{t('createPostModal.charCount', { count: text.length, max: 1000 })}</span>
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
                {isSubmitting ? t('createPostModal.posting') : t('createPostModal.postButton')}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
