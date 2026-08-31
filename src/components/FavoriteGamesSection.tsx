import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Gamepad2, Loader2, Plus, X } from 'lucide-react'
import {
  addFavoriteGame,
  getFavoriteGames,
  removeFavoriteGame,
  type FavoriteGameEntry,
} from '../api/favoriteGamesApi'
import type { Game } from '../api/gamesApi'
import { resolveMediaUrl, ApiError } from '../api/http'
import { GamePickerInput } from './GamePickerInput'
import { Button } from './ui/Button'
import { useAuth } from '../context/AuthContext'

const MAX_FAVORITES = 6

interface FavoriteGamesSectionProps {
  username: string
  isOwner: boolean
}

export function FavoriteGamesSection({ username, isOwner }: FavoriteGamesSectionProps) {
  const { t } = useTranslation('pagesA')
  const { token } = useAuth()
  const [entries, setEntries] = useState<FavoriteGameEntry[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busyGameId, setBusyGameId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedGame, setSelectedGame] = useState<Game | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    setEntries(null)
    setError(null)
    getFavoriteGames(username)
      .then((result) => {
        if (!cancelled) setEntries(result)
      })
      .catch(() => {
        if (!cancelled) setError(t('profile.favorites.loadError'))
      })
    return () => {
      cancelled = true
    }
  }, [username, t])

  async function handleAdd() {
    if (!token || !selectedGame) {
      setError(t('profile.favorites.chooseGameError'))
      return
    }
    setSaving(true)
    setError(null)
    try {
      const entry = await addFavoriteGame(token, selectedGame.id)
      setEntries((current) => [entry, ...(current ?? [])])
      setShowAddForm(false)
      setSelectedGame(null)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('profile.favorites.addError'))
    } finally {
      setSaving(false)
    }
  }

  async function handleRemove(gameId: string) {
    if (!token) return
    setBusyGameId(gameId)
    setError(null)
    try {
      await removeFavoriteGame(token, gameId)
      setEntries((current) => current?.filter((e) => e.gameId !== gameId) ?? null)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('profile.favorites.removeError'))
    } finally {
      setBusyGameId(null)
    }
  }

  const atMax = (entries?.length ?? 0) >= MAX_FAVORITES

  if (entries === null && !error) {
    return (
      <div className="rounded-xl border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold text-text">{t('profile.favorites.title')}</h2>
        <p className="mt-4 text-muted">{t('profile.favorites.loading')}</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text">{t('profile.favorites.title')}</h2>
        {isOwner && !showAddForm && !atMax && (
          <Button variant="secondary" size="sm" onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t('profile.favorites.addGame')}
          </Button>
        )}
      </div>

      {error && <p className="mt-3 text-sm text-frustrated">{error}</p>}

      {showAddForm && (
        <div className="mt-4 flex flex-col gap-2 rounded-lg border border-primary/40 bg-surface-raised p-3">
          <GamePickerInput selectedGame={selectedGame} onSelect={setSelectedGame} />
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={saving}
              onClick={() => {
                setShowAddForm(false)
                setSelectedGame(null)
                setError(null)
              }}
            >
              {t('profile.favorites.cancel')}
            </Button>
            <Button size="sm" onClick={handleAdd} disabled={saving || !selectedGame}>
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
              {t('profile.favorites.save')}
            </Button>
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-3">
        {entries !== null && entries.length === 0 && !showAddForm ? (
          <p className="text-muted">
            {isOwner ? t('profile.favorites.emptyOwner') : t('profile.favorites.emptyOther')}
          </p>
        ) : (
          entries?.map((entry) => (
            <div
              key={entry.gameId}
              className="group relative flex items-center gap-2 rounded-full border border-border bg-surface-raised py-1.5 pl-1.5 pr-3 text-sm text-text"
            >
              {entry.gameCoverImageUrl ? (
                <img
                  src={resolveMediaUrl(entry.gameCoverImageUrl)!}
                  alt=""
                  className="h-6 w-6 rounded-full object-cover"
                />
              ) : (
                <Gamepad2 className="h-5 w-5 text-muted" aria-hidden="true" />
              )}
              <span className="truncate">{entry.gameName}</span>
              {isOwner && (
                <button
                  type="button"
                  aria-label={t('profile.favorites.removeAriaLabel', { gameName: entry.gameName })}
                  disabled={busyGameId === entry.gameId}
                  onClick={() => handleRemove(entry.gameId)}
                  className="ml-1 rounded-full p-0.5 text-muted hover:text-frustrated disabled:opacity-50 cursor-pointer"
                >
                  {busyGameId === entry.gameId ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  ) : (
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
