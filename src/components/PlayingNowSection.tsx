import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Gamepad2, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react'
import {
  getPlayingNow,
  removePlayingNow,
  setPlayingNow,
  type PlayingNowEntry,
} from '../api/profilesApi'
import type { Game } from '../api/gamesApi'
import { resolveMediaUrl, ApiError } from '../api/http'
import { GamePickerInput } from './GamePickerInput'
import { Button } from './ui/Button'
import { useAuth } from '../context/AuthContext'

const MAX_STATUS_LENGTH = 200

interface PlayingNowSectionProps {
  username: string
  isOwner: boolean
}

export function PlayingNowSection({ username, isOwner }: PlayingNowSectionProps) {
  const { t } = useTranslation('pagesA')
  const { token } = useAuth()
  const [entries, setEntries] = useState<PlayingNowEntry[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busyGameId, setBusyGameId] = useState<string | null>(null)
  const [editingGameId, setEditingGameId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  useEffect(() => {
    let cancelled = false
    setEntries(null)
    setError(null)
    getPlayingNow(username)
      .then((result) => {
        if (!cancelled) setEntries(result)
      })
      .catch(() => {
        if (!cancelled) setError(t('profile.playingNow.loadError'))
      })
    return () => {
      cancelled = true
    }
  }, [username, t])

  function handleAdded(entry: PlayingNowEntry) {
    setShowAddForm(false)
    setEntries((current) => {
      const withoutExisting = (current ?? []).filter((e) => e.gameId !== entry.gameId)
      return [entry, ...withoutExisting]
    })
  }

  function handleUpdated(entry: PlayingNowEntry, originalGameId: string) {
    setEditingGameId(null)
    setEntries((current) => {
      if (!current) return null
      const withoutOld = current.filter((e) => e.gameId !== entry.gameId && e.gameId !== originalGameId)
      return [entry, ...withoutOld]
    })
  }

  async function handleRemove(gameId: string) {
    if (!token) return
    setBusyGameId(gameId)
    setError(null)
    try {
      await removePlayingNow(token, gameId)
      setEntries((current) => current?.filter((e) => e.gameId !== gameId) ?? null)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('profile.playingNow.removeError'))
    } finally {
      setBusyGameId(null)
    }
  }

  if (entries === null && !error) {
    return (
      <div className="rounded-xl border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold text-text">{t('profile.playingNow.title')}</h2>
        <p className="mt-4 text-muted">{t('profile.playingNow.loading')}</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text">{t('profile.playingNow.title')}</h2>
        {isOwner && !showAddForm && (
          <Button variant="secondary" size="sm" onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t('profile.playingNow.addGame')}
          </Button>
        )}
      </div>

      {error && <p className="mt-3 text-sm text-frustrated">{error}</p>}

      <div className="mt-4 flex flex-col gap-3">
        {showAddForm && (
          <PlayingNowForm onSaved={handleAdded} onCancel={() => setShowAddForm(false)} />
        )}

        {entries !== null && entries.length === 0 && !showAddForm ? (
          <p className="text-muted">
            {isOwner ? t('profile.playingNow.emptyOwner') : t('profile.playingNow.emptyOther')}
          </p>
        ) : (
          entries?.map((entry) =>
            editingGameId === entry.gameId ? (
              <PlayingNowForm
                key={entry.gameId}
                originalGameId={entry.gameId}
                initialGame={{ id: entry.gameId, name: entry.gameName, coverImageUrl: entry.gameCoverImageUrl, genre: null }}
                initialStatusText={entry.statusText}
                onSaved={handleUpdated}
                onCancel={() => setEditingGameId(null)}
              />
            ) : (
              <div
                key={entry.gameId}
                className="flex items-center gap-3 rounded-lg border border-border bg-surface-raised p-3"
              >
                {entry.gameCoverImageUrl ? (
                  <img
                    src={resolveMediaUrl(entry.gameCoverImageUrl)!}
                    alt=""
                    className="h-12 w-12 shrink-0 rounded object-cover"
                  />
                ) : (
                  <Gamepad2 className="h-10 w-10 shrink-0 text-muted" aria-hidden="true" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-text">{entry.gameName}</p>
                  {entry.statusText && <p className="truncate text-sm text-muted">{entry.statusText}</p>}
                </div>
                {isOwner && (
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      aria-label={t('profile.playingNow.editAriaLabel', { gameName: entry.gameName })}
                      disabled={busyGameId === entry.gameId}
                      onClick={() => setEditingGameId(entry.gameId)}
                      className="rounded-lg p-1.5 text-muted hover:bg-border hover:text-text disabled:opacity-50 cursor-pointer"
                    >
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      aria-label={t('profile.playingNow.removeAriaLabel', { gameName: entry.gameName })}
                      disabled={busyGameId === entry.gameId}
                      onClick={() => handleRemove(entry.gameId)}
                      className="rounded-lg p-1.5 text-muted hover:bg-border hover:text-frustrated disabled:opacity-50 cursor-pointer"
                    >
                      {busyGameId === entry.gameId ? (
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      ) : (
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            ),
          )
        )}
      </div>
    </div>
  )
}

interface PlayingNowFormProps {
  originalGameId?: string
  initialGame?: Game
  initialStatusText?: string | null
  onSaved: (entry: PlayingNowEntry, originalGameId: string) => void
  onCancel: () => void
}

function PlayingNowForm({
  originalGameId,
  initialGame,
  initialStatusText,
  onSaved,
  onCancel,
}: PlayingNowFormProps) {
  const { t } = useTranslation('pagesA')
  const { token } = useAuth()
  const [selectedGame, setSelectedGame] = useState<Game | null>(initialGame ?? null)
  const [statusText, setStatusText] = useState(initialStatusText ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    if (!token || !selectedGame) {
      setError(t('profile.playingNow.chooseGameError'))
      return
    }
    setSaving(true)
    setError(null)
    try {
      if (originalGameId && originalGameId !== selectedGame.id) {
        // Game changed while editing: the game is part of the entry's primary key
        // server-side, so switch by removing the old entry and creating a new one.
        await removePlayingNow(token, originalGameId)
      }
      const entry = await setPlayingNow(token, selectedGame.id, statusText.trim() || null)
      onSaved(entry, originalGameId ?? entry.gameId)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('profile.playingNow.saveError'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-primary/40 bg-surface-raised p-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-text">
          {originalGameId ? t('profile.playingNow.editTitle') : t('profile.playingNow.addGame')}
        </p>
        <button
          type="button"
          aria-label={t('profile.playingNow.cancel')}
          onClick={onCancel}
          className="rounded-lg p-1 text-muted hover:bg-border hover:text-text cursor-pointer"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <GamePickerInput selectedGame={selectedGame} onSelect={setSelectedGame} />

      <input
        value={statusText}
        onChange={(e) => setStatusText(e.target.value.slice(0, MAX_STATUS_LENGTH))}
        placeholder={t('profile.playingNow.statusPlaceholder')}
        className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-primary placeholder:text-muted"
      />

      {error && <p className="text-sm text-frustrated">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button variant="secondary" size="sm" onClick={onCancel} disabled={saving}>
          {t('profile.playingNow.cancel')}
        </Button>
        <Button size="sm" onClick={handleSave} disabled={saving || !selectedGame}>
          {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
          {t('profile.playingNow.save')}
        </Button>
      </div>
    </div>
  )
}
