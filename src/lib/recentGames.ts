import type { Game } from '../api/gamesApi'

const STORAGE_KEY = 'playr_recent_games_v2'
const MAX_RECENT = 5

function isGame(value: unknown): value is Game {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return (
    typeof v.id === 'string' &&
    typeof v.name === 'string' &&
    (typeof v.coverImageUrl === 'string' || v.coverImageUrl === null) &&
    (typeof v.genre === 'string' || v.genre === null)
  )
}

export function getRecentGames(): Game[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter(isGame) : []
  } catch {
    return []
  }
}

export function addRecentGame(game: Game): void {
  try {
    const existing = getRecentGames().filter((g) => g.id !== game.id)
    const next = [game, ...existing].slice(0, MAX_RECENT)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // localStorage unavailable — ignore.
  }
}

export function removeRecentGame(gameId: string): void {
  try {
    const next = getRecentGames().filter((g) => g.id !== gameId)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // localStorage unavailable — ignore.
  }
}
