const STORAGE_KEY = 'playr_recent_games'
const MAX_RECENT = 5

export function getRecentGameIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : []
  } catch {
    return []
  }
}

export function addRecentGameId(gameId: string): void {
  try {
    const existing = getRecentGameIds().filter((id) => id !== gameId)
    const next = [gameId, ...existing].slice(0, MAX_RECENT)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // localStorage unavailable — ignore.
  }
}
