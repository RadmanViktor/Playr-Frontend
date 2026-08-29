import { useEffect, useRef } from 'react'

const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'] as const
const CHECK_INTERVAL_MS = 15_000

interface UseIdleTimerOptions {
  /** How long without activity before `onIdle` fires. */
  timeoutMs: number
  /** Called once when the user transitions from active to idle. */
  onIdle: () => void
  /** Called once when activity resumes after having been idle. */
  onActive: () => void
  /** Tracking only runs while this is true (e.g. while the user is logged in). */
  enabled: boolean
}

/**
 * Watches for mouse/keyboard/scroll/touch activity and reports idle <-> active
 * transitions after `timeoutMs` of silence. Does not track anything (and never
 * fires) while `enabled` is false, so callers can gate it on auth state.
 */
export function useIdleTimer({ timeoutMs, onIdle, onActive, enabled }: UseIdleTimerOptions): void {
  // Refs so the event listeners/interval below don't need to be torn down and
  // re-created every time a caller passes a fresh callback identity.
  const onIdleRef = useRef(onIdle)
  onIdleRef.current = onIdle
  const onActiveRef = useRef(onActive)
  onActiveRef.current = onActive

  const lastActivityRef = useRef(Date.now())
  const isIdleRef = useRef(false)

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return

    lastActivityRef.current = Date.now()
    isIdleRef.current = false

    const handleActivity = () => {
      lastActivityRef.current = Date.now()
      if (isIdleRef.current) {
        isIdleRef.current = false
        onActiveRef.current()
      }
    }

    ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, handleActivity, { passive: true }))

    const intervalId = window.setInterval(() => {
      if (!isIdleRef.current && Date.now() - lastActivityRef.current >= timeoutMs) {
        isIdleRef.current = true
        onIdleRef.current()
      }
    }, CHECK_INTERVAL_MS)

    return () => {
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, handleActivity))
      window.clearInterval(intervalId)
    }
  }, [enabled, timeoutMs])
}
