import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, Gamepad2, Loader2 } from 'lucide-react'
import { createGame, searchExternalGames, type ExternalGameSearchResult, type Game } from '../api/gamesApi'
import { resolveMediaUrl } from '../api/http'
import { useAuth } from '../context/AuthContext'
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
  const [results, setResults] = useState<ExternalGameSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [addingRawgId, setAddingRawgId] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const isMobile = useIsMobile()

  // Always search RAWG's catalog: an empty query returns a default/popular
  // selection so the dropdown has something useful to show before typing.
  useEffect(() => {
    if (!open || !token) return
    let cancelled = false
    setSearching(true)
    setSearchError(null)
    const timeoutId = setTimeout(() => {
      searchExternalGames(token, query.trim())
        .then((r) => {
          if (!cancelled) setResults(r)
        })
        .catch(() => {
          if (!cancelled) setSearchError(t('gamePickerInput.searchError'))
        })
        .finally(() => {
          if (!cancelled) setSearching(false)
        })
    }, 250)

    return () => {
      cancelled = true
      clearTimeout(timeoutId)
    }
  }, [query, token, open, t])

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
      onSelect(game)
      setOpen(false)
      setQuery('')
    } catch {
      setSearchError(t('gamePickerInput.addError'))
    } finally {
      setAddingRawgId(null)
    }
  }

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
      setHighlightedIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const result = results[highlightedIndex]
      if (result) void selectResult(result)
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
                  <img src={resolveMediaUrl(result.coverImageUrl)!} alt="" className="h-6 w-6 rounded object-cover" />
                ) : (
                  <Gamepad2 className="h-5 w-5 shrink-0" aria-hidden="true" />
                )}
                <span className="flex-1 truncate">{result.name}</span>
                {addingRawgId === result.rawgId && (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
