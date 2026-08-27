import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, Gamepad2, RefreshCw } from 'lucide-react'
import type { Game } from '../api/gamesApi'
import { getRecentGameIds } from '../lib/recentGames'

interface GamePickerInputProps {
  games: Game[]
  value: string
  onChange: (gameId: string) => void
  error?: string | null
  onRetry?: () => void
  disabled?: boolean
}

export function GamePickerInput({ games, value, onChange, error, onRetry, disabled }: GamePickerInputProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

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
      setHighlightedIndex((i) => Math.min(i + 1, filteredGames.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const game = filteredGames[highlightedIndex]
      if (game) selectGame(game.id)
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
            Try again
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        aria-label="Select a game"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={handleKeyDown}
        className="flex w-full items-center gap-2 rounded-lg border border-border bg-surface-raised px-3 py-2 text-left text-text outline-none focus:border-primary disabled:opacity-50 cursor-pointer"
      >
        {selectedGame?.coverImageUrl ? (
          <img src={selectedGame.coverImageUrl} alt="" className="h-6 w-6 rounded object-cover" />
        ) : (
          <Gamepad2 className="h-5 w-5 text-muted" aria-hidden="true" />
        )}
        <span className="flex-1 truncate text-sm">{selectedGame ? selectedGame.name : 'Select a game'}</span>
        <ChevronDown className="h-4 w-4 text-muted" aria-hidden="true" />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-lg border border-border bg-surface shadow-lg">
          <input
            autoFocus
            type="text"
            aria-label="Search games"
            placeholder="Search games…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full border-b border-border bg-transparent px-3 py-2 text-sm text-text outline-none placeholder:text-muted"
          />
          <div className="max-h-56 overflow-y-auto">
            {filteredGames.length === 0 ? (
              <p className="px-3 py-2 text-sm text-muted">No games found.</p>
            ) : (
              filteredGames.map((game, index) => (
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
                    <img src={game.coverImageUrl} alt="" className="h-6 w-6 rounded object-cover" />
                  ) : (
                    <Gamepad2 className="h-5 w-5 shrink-0" aria-hidden="true" />
                  )}
                  <span className="truncate">{game.name}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
