import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Gamepad2, Loader2, Plus, Trash2 } from 'lucide-react'
import { Button } from './ui/Button'
import {
  addGameToLibrary,
  getGameLibrary,
  rateGame,
  removeGameFromLibrary,
  type GameLibraryEntry,
} from '../api/gameLibraryApi'
import { resolveMediaUrl } from '../api/http'
import { useAuth } from '../context/AuthContext'
import { ApiError } from '../api/http'
import { AddGameModal } from './AddGameModal'
import { StarRating } from './ui/StarRating'
import type { Game } from '../api/gamesApi'

interface MyGamesLibraryProps {
  username: string
  isOwner: boolean
}

export function MyGamesLibrary({ username, isOwner }: MyGamesLibraryProps) {
  const { t } = useTranslation('componentsB')
  const { token } = useAuth()
  const [entries, setEntries] = useState<GameLibraryEntry[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showAddGameModal, setShowAddGameModal] = useState(false)
  const [busyGameId, setBusyGameId] = useState<string | null>(null)

  useEffect(() => {
    setEntries(null)
    setError(null)
    getGameLibrary(username)
      .then(setEntries)
      .catch(() => setError(t('myGamesLibrary.loadError')))
  }, [username])

  async function handleGameAdded(game: Game) {
    if (!token) return
    setShowAddGameModal(false)
    try {
      const entry = await addGameToLibrary(token, game.id)
      setEntries((current) => [entry, ...(current ?? [])])
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('myGamesLibrary.addError'))
    }
  }

  async function handleRate(gameId: string, rating: number, reviewText: string | null) {
    if (!token) return
    setBusyGameId(gameId)
    setError(null)
    try {
      const updated = await rateGame(token, gameId, rating, reviewText)
      setEntries((current) => current?.map((e) => (e.gameId === gameId ? updated : e)) ?? null)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('myGamesLibrary.rateError'))
    } finally {
      setBusyGameId(null)
    }
  }

  async function handleRemove(gameId: string) {
    if (!token) return
    setBusyGameId(gameId)
    setError(null)
    try {
      await removeGameFromLibrary(token, gameId)
      setEntries((current) => current?.filter((e) => e.gameId !== gameId) ?? null)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('myGamesLibrary.removeError'))
    } finally {
      setBusyGameId(null)
    }
  }

  if (entries === null && !error) return <p className="text-muted">{t('myGamesLibrary.loading')}</p>
  if (error && entries === null) return <p className="text-frustrated">{error}</p>

  return (
    <div className="flex flex-col gap-3 pb-20 md:pb-0">
      {isOwner && (
        <div className="hidden justify-end md:flex">
          <Button variant="secondary" size="sm" onClick={() => setShowAddGameModal(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t('myGamesLibrary.addGame')}
          </Button>
        </div>
      )}

      {error && <p className="text-sm text-frustrated">{error}</p>}

      {entries !== null && entries.length === 0 ? (
        <p className="text-muted">
          {isOwner ? t('myGamesLibrary.emptyOwner') : t('myGamesLibrary.emptyOther')}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {entries?.map((entry) => (
            <li
              key={entry.gameId}
              className="flex flex-col gap-2 rounded-lg border border-border bg-surface-raised p-3"
            >
              <div className="flex items-center gap-3">
                {entry.gameCoverImageUrl ? (
                  <img
                    src={resolveMediaUrl(entry.gameCoverImageUrl)!}
                    alt=""
                    className="h-10 w-10 rounded object-cover"
                  />
                ) : (
                  <Gamepad2 className="h-8 w-8 text-muted" aria-hidden="true" />
                )}
                <div className="flex-1">
                  <p className="font-medium text-text">{entry.gameName}</p>
                  {entry.genre && <p className="text-xs text-muted">{entry.genre}</p>}
                </div>
                {isOwner && (
                  <button
                    type="button"
                    aria-label={t('myGamesLibrary.removeFromLibraryAriaLabel', { gameName: entry.gameName })}
                    disabled={busyGameId === entry.gameId}
                    onClick={() => handleRemove(entry.gameId)}
                    className="rounded-lg p-1.5 text-muted hover:bg-border hover:text-frustrated disabled:opacity-50 cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
              </div>

              {isOwner ? (
                <RatingEditor
                  entry={entry}
                  disabled={busyGameId === entry.gameId}
                  onSave={(rating, reviewText) => handleRate(entry.gameId, rating, reviewText)}
                />
              ) : (
                entry.rating !== null && (
                  <div className="flex flex-col gap-1">
                    <StarRating value={entry.rating} size={16} />
                    {entry.reviewText && <p className="text-sm text-muted">{entry.reviewText}</p>}
                  </div>
                )
              )}
            </li>
          ))}
        </ul>
      )}

      {showAddGameModal && (
        <AddGameModal onClose={() => setShowAddGameModal(false)} onGameAdded={handleGameAdded} />
      )}

      {isOwner && (
        <button
          type="button"
          aria-label={t('myGamesLibrary.addGame')}
          onClick={() => setShowAddGameModal(true)}
          className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-transform hover:scale-105 active:scale-95 md:hidden"
        >
          <Plus className="h-6 w-6" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}

interface RatingEditorProps {
  entry: GameLibraryEntry
  disabled: boolean
  onSave: (rating: number, reviewText: string | null) => void
}

function RatingEditor({ entry, disabled, onSave }: RatingEditorProps) {
  const { t } = useTranslation('componentsB')
  const [rating, setRating] = useState(entry.rating ?? 0)
  const [reviewText, setReviewText] = useState(entry.reviewText ?? '')
  const isDirty = rating !== (entry.rating ?? 0) || reviewText !== (entry.reviewText ?? '')

  return (
    <div className="flex flex-col gap-2">
      <StarRating value={rating} onChange={setRating} />
      <textarea
        value={reviewText}
        onChange={(e) => setReviewText(e.target.value)}
        placeholder={t('myGamesLibrary.reviewPlaceholder')}
        rows={2}
        maxLength={1000}
        className="w-full resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-primary placeholder:text-muted"
      />
      {isDirty && rating > 0 && (
        <Button size="sm" className="w-fit" disabled={disabled} onClick={() => onSave(rating, reviewText.trim() || null)}>
          {disabled && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
          {t('myGamesLibrary.saveRating')}
        </Button>
      )}
    </div>
  )
}
