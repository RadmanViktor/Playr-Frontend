import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, Gamepad2, Loader2, X } from 'lucide-react'
import { createGame, type ExternalGameSearchResult, type Game } from '../api/gamesApi'
import { resolveMediaUrl } from '../api/http'
import { useAuth } from '../context/AuthContext'
import { addRecentGame, getRecentGames, removeRecentGame } from '../lib/recentGames'
import { useGameSearch } from '../lib/useGameSearch'
import { useIsMobile } from '../lib/useIsMobile'

interface GamePickerInputProps {
  selectedGame: Game | null
  onSelect: (game: Game) => void
  disabled?: boolean
}

export function GamePickerInput({ selectedGame, onSelect, disabled }: GamePickerInputProps) {
  const { t } = useTranslation('componentsB')
  const { token } = useAuth()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const [addingRawgId, setAddingRawgId] = useState<number | null>(null)
  const [selectError, setSelectError] = useState<string | null>(null)
  const [recentGames, setRecentGames] = useState<Game[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const isMobile = useIsMobile()

  const showRecent = open && query.trim() === '' && recentGames.length > 0

  useEffect(() => {
    if (open) setRecentGames(getRecentGames())
  }, [open])

  // Always search RAWG's catalog: an empty query returns a default/popular
  // selection so the dropdown has something useful to show before typing,
  // unless we already have recently used games to show instead.
  const {
    results,
    searching,
    error: searchFailed,
  } = useGameSearch(query, token, { enabled: open && !showRecent, skipEmptyQuery: false })
  const searchError = selectError ?? (searchFailed ? t('gamePickerInput.searchError') : null)

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

  async function selectResult(result: ExternalGameSearchResult) {
    if (!token) return
    setAddingRawgId(result.rawgId)
    try {
      const game = await createGame(token, result)
      addRecentGame(game)
      onSelect(game)
      setOpen(false)
      setQuery('')
    } catch {
      setSelectError(t('gamePickerInput.addError'))
    } finally {
      setAddingRawgId(null)
    }
  }

  function selectRecentGame(game: Game) {
    addRecentGame(game)
    onSelect(game)
    setOpen(false)
    setQuery('')
  }

  function handleRemoveRecentGame(e: React.MouseEvent, gameId: string) {
    e.stopPropagation()
    removeRecentGame(gameId)
    setRecentGames((prev) => prev.filter((g) => g.id !== gameId))
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        e.preventDefault()
        setOpen(true)
      }
      return
    }
    const listLength = showRecent ? recentGames.length : results.length
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex((i) => Math.min(i + 1, listLength - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (showRecent) {
        const game = recentGames[highlightedIndex]
        if (game) selectRecentGame(game)
      } else {
        const result = results[highlightedIndex]
        if (result) void selectResult(result)
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
      setQuery('')
    }
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
        <span className="flex-1 truncate text-sm">
          {selectedGame ? selectedGame.name : t('gamePickerInput.selectGamePlaceholder')}
        </span>
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
            {showRecent ? (
              <>
                <p className="px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-muted">
                  {t('gamePickerInput.recentlyUsedHeading')}
                </p>
                {recentGames.map((game, index) => (
                  <button
                    key={game.id}
                    type="button"
                    onClick={() => selectRecentGame(game)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm cursor-pointer ${
                      index === highlightedIndex ? 'bg-surface-raised text-text' : 'text-muted hover:text-text'
                    }`}
                  >
                    {game.coverImageUrl ? (
                      <img
                        src={resolveMediaUrl(game.coverImageUrl)!}
                        alt=""
                        className="h-6 w-6 rounded object-cover"
                      />
                    ) : (
                      <Gamepad2 className="h-5 w-5 shrink-0" aria-hidden="true" />
                    )}
                    <span className="flex-1 truncate">{game.name}</span>
                    <span
                      role="button"
                      tabIndex={0}
                      aria-label={t('gamePickerInput.removeRecentGameAriaLabel', { name: game.name })}
                      onClick={(e) => handleRemoveRecentGame(e, game.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          handleRemoveRecentGame(e as unknown as React.MouseEvent, game.id)
                        }
                      }}
                      className="shrink-0 rounded p-1 text-muted hover:text-text"
                    >
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                  </button>
                ))}
              </>
            ) : (
              <>
                {searching && results.length === 0 && (
                  <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    {t('gamePickerInput.searching')}
                  </div>
                )}

                {!searching && searchError && <p className="px-3 py-2 text-sm text-frustrated">{searchError}</p>}

                {!searching && !searchError && results.length === 0 && (
                  <p className="px-3 py-2 text-sm text-muted">{t('gamePickerInput.noGamesFound')}</p>
                )}

                {results.map((result, index) => (
                  <button
                    key={result.rawgId}
                    type="button"
                    disabled={addingRawgId !== null}
                    onClick={() => void selectResult(result)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm cursor-pointer disabled:opacity-50 ${
                      index === highlightedIndex ? 'bg-surface-raised text-text' : 'text-muted hover:text-text'
                    }`}
                  >
                    {result.coverImageUrl ? (
                      <img
                        src={resolveMediaUrl(result.coverImageUrl)!}
                        alt=""
                        className="h-6 w-6 rounded object-cover"
                      />
                    ) : (
                      <Gamepad2 className="h-5 w-5 shrink-0" aria-hidden="true" />
                    )}
                    <span className="flex-1 truncate">{result.name}</span>
                    {addingRawgId === result.rawgId && (
                      <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
                    )}
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
