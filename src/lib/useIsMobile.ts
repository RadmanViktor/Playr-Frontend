import { useEffect, useState } from 'react'

/** Matches Tailwind's `sm` breakpoint, i.e. everything below `sm:` is "mobile". */
export const MOBILE_MEDIA_QUERY = '(max-width: 639px)'

/**
 * Tracks whether the viewport is below Tailwind's `sm` breakpoint.
 *
 * Kept in sync with the CSS breakpoint on purpose: components that branch on
 * this must agree with their own `sm:` utility classes, otherwise layout and
 * behaviour disagree at the boundary.
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
    return window.matchMedia(MOBILE_MEDIA_QUERY).matches
  })

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return

    const query = window.matchMedia(MOBILE_MEDIA_QUERY)
    const handleChange = (event: MediaQueryListEvent) => setIsMobile(event.matches)

    // Re-sync in case the viewport changed between render and effect.
    setIsMobile(query.matches)
    query.addEventListener('change', handleChange)
    return () => query.removeEventListener('change', handleChange)
  }, [])

  return isMobile
}
