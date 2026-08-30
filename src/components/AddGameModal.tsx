import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Gamepad2, Loader2 } from 'lucide-react'
import { Modal } from './ui/Modal'
import { useAuth } from '../context/AuthContext'
import {
  createGame,
  searchExternalGames,
  type ExternalGameSearchResult,
  type Game,
} from '../api/gamesApi'
import { resolveMediaUrl } from '../api/http'

interface AddGameModalProps {
  onClose: () => void
  onGameAdded: (game: Game) => void
}

export function AddGameModal({ onClose, onGameAdded }: AddGameModalProps) {
  const { t } = useTranslation('componentsB')
  const { token } = useAuth()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ExternalGameSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [addingRawgId, setAddingRawgId] = useState<number | null>(null)
  const [addError, setAddError] = useState<string | null>(null)

  useEffect(() => {
    const trimmed = query.trim()
    if (!trimmed) {
      setResults([])
      setSearchError(null)
      return
    }

    let cancelled = false
    setSearching(true)
    setSearchError(null)
    const timeoutId = setTimeout(() => {
      searchExternalGames(token!, trimmed)
        .then((r) => {
          if (!cancelled) setResults(r)
        })
        .catch(() => {
          if (!cancelled) setSearchError(t('addGameModal.searchError'))
        })
        .finally(() => {
          if (!cancelled) setSearching(false)
        })
    }, 300)

    return () => {
      cancelled = true
      clearTimeout(timeoutId)
    }
  }, [query, token])

  async function handleSelect(result: ExternalGameSearchResult) {
    setAddError(null)
    setAddingRawgId(result.rawgId)
    try {
      const game = await createGame(token!, result)
      onGameAdded(game)
    } catch {
      setAddError(t('addGameModal.addError'))
    } finally {
      setAddingRawgId(null)
    }
  }

  return (
    <Modal title={t('addGameModal.title')} onClose={onClose}>
      <div className="flex flex-col gap-3">
        <input
          autoFocus
          type="text"
          aria-label={t('addGameModal.searchAriaLabel')}
          placeholder={t('addGameModal.searchPlaceholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-text outline-none focus:border-primary placeholder:text-muted"
        />

        {addError && <p className="text-sm text-frustrated">{addError}</p>}

        <div className="flex max-h-80 flex-col gap-1 overflow-y-auto">
          {searching && (
            <div className="flex items-center gap-2 px-1 py-2 text-sm text-muted">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              {t('addGameModal.searching')}
            </div>
          )}

          {!searching && searchError && <p className="px-1 py-2 text-sm text-frustrated">{searchError}</p>}

          {!searching && !searchError && query.trim() && results.length === 0 && (
            <p className="px-1 py-2 text-sm text-muted">{t('addGameModal.noGamesFound')}</p>
          )}

          {!searching &&
            results.map((result) => (
              <button
                key={result.rawgId}
                type="button"
                disabled={addingRawgId !== null}
                onClick={() => handleSelect(result)}
                className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm text-text hover:bg-surface-raised disabled:opacity-50 cursor-pointer"
              >
                {result.coverImageUrl ? (
                  <img
                    src={resolveMediaUrl(result.coverImageUrl)!}
                    alt=""
                    className="h-10 w-10 shrink-0 rounded object-cover"
                  />
                ) : (
                  <Gamepad2 className="h-8 w-8 shrink-0 text-muted" aria-hidden="true" />
                )}
                <span className="flex-1">
                  <span className="block truncate font-medium">{result.name}</span>
                  {result.genre && <span className="block truncate text-xs text-muted">{result.genre}</span>}
                </span>
                {addingRawgId === result.rawgId && (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted" aria-hidden="true" />
                )}
              </button>
            ))}
        </div>
      </div>
    </Modal>
  )
}
