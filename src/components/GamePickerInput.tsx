import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, Gamepad2, Loader2, RefreshCw } from 'lucide-react'
import { createGame, searchExternalGames, type ExternalGameSearchResult, type Game } from '../api/gamesApi'
import { resolveMediaUrl } from '../api/http'
import { useAuth } from '../context/AuthContext'
import { getRecentGameIds } from '../lib/recentGames'
import { useIsMobile } from '../lib/useIsMobile'

interface GamePickerInputProps {
  games: Game[]
  value: string
  onChange: (gameId: string) => void
  error?: string | null
  onRetry?: () => void
  disabled?: boolean
  onGameAdded?: (game: Game) => void
}

export function GamePickerInput({ games, value, onChange, error, onRetry, disabled, onGameAdded }: GamePickerInputProps) {
  const { t } = useTranslation('componentsB')
  const { token } = useAuth()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const [externalResults, setExternalResults] = useState<ExternalGameSearchResult[]>([])
  const [externalSearching, setExternalSearching] = useState(false)
  const [externalError, setExternalError] = useState<string | null>(null)
  const [addingRawgId, setAddingRawgId] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const isMobile = useIsMobile()

  const selectedGame = games.find((g) => g.id === value) ?? null

  const orderedGames = useMemo(() => {
    const recentIds = getRecentGameIds()
    const recent = recentIds
      .map((id) => games.find((g) => g.id === id))
      .filter((g): g is Game => Boolean(g))
    const rest = games.filter((g) => !recentIds.includes(g.id))
    return [...recent, ...rest]
  }, [games])

  const filteredGames = useMemo(() => {
    const trimmed = query.trim().toLowerCase()
    if (!trimmed) return orderedGames
    return orderedGames.filter((g) => g.name.toLowerCase().includes(trimmed))
  }, [orderedGames, query])

  // Search RAWG's full game catalog whenever the user types, so any game can
  // be found even if it isn't in our local catalog yet.
  useEffect(() => {
    const trimmed = query.trim()
    if (!trimmed || !token) {
      setExternalResults([])
      setExternalError(null)
      setExternalSearching(false)
      return
    }

    let cancelled = false
    setExternalSearching(true)
    setExternalError(null)
    const timeoutId = setTimeout(() => {
      searchExternalGames(token, trimmed)
        .then((r) => {
          if (!cancelled) setExternalResults(r)
        })
        .catch(() => {
          if (!cancelled) setExternalError(t('gamePickerInput.searchError'))
        })
        .finally(() => {
          if (!cancelled) setExternalSearching(false)
        })
    }, 300)

    return () => {
      cancelled = true
      clearTimeout(timeoutId)
    }
  }, [query, token])

  // Hide RAWG results that already match a game we're showing from the local list.
  const filteredExternalResults = useMemo(() => {
    const shownNames = new Set(filteredGames.map((g) => g.name.trim().toLowerCase()))
    return externalResults.filter((r) => !shownNames.has(r.name.trim().toLowerCase()))
  }, [externalResults, filteredGames])

  useEffect(() => {
    setHighlightedIndex(0)
  }, [query, open])

  useEffect(() => {
    if (!open) return
    function handleMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [open])

  function selectGame(gameId: string) {
    onChange(gameId)
    setOpen(false)
    setQuery('')
  }

  async function selectExternalGame(result: ExternalGameSearchResult) {
    if (!token) return
    setAddingRawgId(result.rawgId)
    try {
      const game = await createGame(token, result)
      onGameAdded?.(game)
      selectGame(game.id)
    } catch {
      setExternalError(t('gamePickerInput.addError'))
    } finally {
      setAddingRawgId(null)
    }
  }

  const combinedCount = filteredGames.length + filteredExternalResults.length

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        e.preventDefault()
        setOpen(true)
      }
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex((i) => Math.min(i + 1, combinedCount - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (highlightedIndex < filteredGames.length) {
        const game = filteredGames[highlightedIndex]
        if (game) selectGame(game.id)
      } else {
        const result = filteredExternalResults[highlightedIndex - filteredGames.length]
        if (result) void selectExternalGame(result)
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
      setQuery('')
    }
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-frustrated">
        <span className="flex-1">{error}</span>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-text hover:bg-border cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            {t('gamePickerInput.tryAgain')}
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        aria-label={t('gamePickerInput.selectGameAriaLabel')}
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={handleKeyDown}
        className="flex w-full items-center gap-2 rounded-lg border border-border bg-surface-raised px-3 py-2 text-left text-text outline-none focus:border-primary disabled:opacity-50 cursor-pointer"
      >
        {selectedGame?.coverImageUrl ? (
          <img src={resolveMediaUrl(selectedGame.coverImageUrl)!} alt="" className="h-6 w-6 rounded object-cover" />
        ) : (
          <Gamepad2 className="h-5 w-5 text-muted" aria-hidden="true" />
        )}
        <span className="flex-1 truncate text-sm">{selectedGame ? selectedGame.name : t('gamePickerInput.selectGamePlaceholder')}</span>
        <ChevronDown className="h-4 w-4 text-muted" aria-hidden="true" />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-lg border border-border bg-surface shadow-lg">
          <input
            // Autofocusing on mobile raises the virtual keyboard, which covers
            // the results list below and leaves the picker looking empty.
            autoFocus={!isMobile}
            type="text"
            aria-label={t('gamePickerInput.searchGamesAriaLabel')}
            placeholder={t('gamePickerInput.searchGamesPlaceholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full border-b border-border bg-transparent px-3 py-2 text-sm text-text outline-none placeholder:text-muted"
          />
          <div className="max-h-56 overflow-y-auto">
            {filteredGames.length === 0 && filteredExternalResults.length === 0 && !externalSearching ? (
              <p className="px-3 py-2 text-sm text-muted">{t('gamePickerInput.noGamesFound')}</p>
            ) : (
              <>
                {filteredGames.map((game, index) => (
                  <button
                    key={game.id}
                    type="button"
                    onClick={() => selectGame(game.id)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm cursor-pointer ${
                      index === highlightedIndex ? 'bg-surface-raised text-text' : 'text-muted hover:text-text'
                    }`}
                  >
                    {game.coverImageUrl ? (
                      <img src={resolveMediaUrl(game.coverImageUrl)!} alt="" className="h-6 w-6 rounded object-cover" />
                    ) : (
                      <Gamepad2 className="h-5 w-5 shrink-0" aria-hidden="true" />
                    )}
                    <span className="truncate">{game.name}</span>
                  </button>
                ))}

                {filteredExternalResults.map((result, resultIndex) => {
                  const index = filteredGames.length + resultIndex
                  return (
                    <button
                      key={result.rawgId}
                      type="button"
                      disabled={addingRawgId !== null}
                      onClick={() => void selectExternalGame(result)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm cursor-pointer disabled:opacity-50 ${
                        index === highlightedIndex ? 'bg-surface-raised text-text' : 'text-muted hover:text-text'
                      }`}
                    >
                      {result.coverImageUrl ? (
                        <img src={resolveMediaUrl(result.coverImageUrl)!} alt="" className="h-6 w-6 rounded object-cover" />
                      ) : (
                        <Gamepad2 className="h-5 w-5 shrink-0" aria-hidden="true" />
                      )}
                      <span className="flex-1 truncate">{result.name}</span>
                      {addingRawgId === result.rawgId && (
                        <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
                      )}
                    </button>
                  )
                })}
              </>
            )}

            {externalSearching && (
              <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                {t('gamePickerInput.searching')}
              </div>
            )}

            {externalError && <p className="px-3 py-2 text-sm text-frustrated">{externalError}</p>}
          </div>
        </div>
      )}
    </div>
  )
}
