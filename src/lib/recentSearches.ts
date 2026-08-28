const STORAGE_KEY = 'playr_recent_searches'
const MAX_RECENT = 5

export interface RecentSearch {
  userId: string
  username: string
  displayName: string
  avatarUrl: string | null
}

function isRecentSearch(value: unknown): value is RecentSearch {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return (
    typeof v.userId === 'string' &&
    typeof v.username === 'string' &&
    typeof v.displayName === 'string' &&
    (typeof v.avatarUrl === 'string' || v.avatarUrl === null)
  )
}

export function getRecentSearches(): RecentSearch[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter(isRecentSearch) : []
  } catch {
    return []
  }
}

export function addRecentSearch(search: RecentSearch): void {
  try {
    const existing = getRecentSearches().filter((s) => s.userId !== search.userId)
    const next = [search, ...existing].slice(0, MAX_RECENT)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // localStorage unavailable — ignore.
  }
}

export function removeRecentSearch(userId: string): void {
  try {
    const next = getRecentSearches().filter((s) => s.userId !== userId)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // localStorage unavailable — ignore.
  }
}

export function clearRecentSearches(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // localStorage unavailable — ignore.
  }
}
