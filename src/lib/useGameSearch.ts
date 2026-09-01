import { useEffect, useRef, useState } from 'react'
import { searchExternalGames, type ExternalGameSearchResult } from '../api/gamesApi'

const DEBOUNCE_MS = 175

// Shared across every consumer of this hook (module-level, not per-component
// state) so that identical searches made from different pickers/modals in the
// same session are instant instead of re-hitting the network. Backend also
// caches RAWG responses, but skipping the round trip entirely is faster still.
const resultsCache = new Map<string, ExternalGameSearchResult[]>()

function cacheKey(query: string): string {
  return query.trim().toLowerCase()
}

interface UseGameSearchOptions {
  /** Search is skipped entirely (and results cleared) while this is false. */
  enabled: boolean
  /** Skips the request for an empty/whitespace-only query instead of fetching a default list. */
  skipEmptyQuery?: boolean
}

interface UseGameSearchResult {
  results: ExternalGameSearchResult[]
  searching: boolean
  error: boolean
}

/**
 * Debounced, cancellation-safe search against the external game catalog
 * (RAWG, via the backend). Shared by every game search/picker UI so they all
 * get the same behavior: a short debounce, real request cancellation via
 * `AbortController` (so a slow stale response can never clobber a newer one),
 * and an in-memory cache for repeated identical queries.
 */
export function useGameSearch(
  query: string,
  token: string | null | undefined,
  { enabled, skipEmptyQuery = true }: UseGameSearchOptions,
): UseGameSearchResult {
  const [results, setResults] = useState<ExternalGameSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const trimmed = query.trim()

    if (!enabled || !token || (skipEmptyQuery && !trimmed)) {
      abortRef.current?.abort()
      setResults([])
      setSearching(false)
      setError(false)
      return
    }

    const key = cacheKey(trimmed)
    const cached = resultsCache.get(key)
    if (cached) {
      setResults(cached)
      setSearching(false)
      setError(false)
      return
    }

    setSearching(true)
    setError(false)

    const timeoutId = setTimeout(() => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      searchExternalGames(token, trimmed, controller.signal)
        .then((r) => {
          resultsCache.set(key, r)
          setResults(r)
        })
        .catch((err) => {
          if (err instanceof DOMException && err.name === 'AbortError') return
          setError(true)
        })
        .finally(() => {
          if (!controller.signal.aborted) setSearching(false)
        })
    }, DEBOUNCE_MS)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [query, token, enabled, skipEmptyQuery])

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  return { results, searching, error }
}
