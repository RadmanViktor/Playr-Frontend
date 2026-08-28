import { useEffect, useState } from 'react'

export interface VisualViewportMetrics {
  height: number
  offsetTop: number
}

/**
 * Tracks the visual viewport so fullscreen overlays can stay above the mobile
 * virtual keyboard.
 *
 * iOS Safari does not resize the *layout* viewport when the keyboard opens, so
 * `100dvh` / `inset-0` still resolve to the full screen height and any bottom
 * anchored input ends up underneath the keyboard. The visual viewport does
 * shrink, so we mirror it onto the element.
 *
 * Returns `null` when disabled or when the API is unavailable, in which case
 * callers should fall back to `dvh` based sizing.
 */
export function useVisualViewportHeight(enabled = true): VisualViewportMetrics | null {
  const [metrics, setMetrics] = useState<VisualViewportMetrics | null>(null)

  useEffect(() => {
    if (!enabled) {
      setMetrics(null)
      return
    }

    const viewport = typeof window !== 'undefined' ? window.visualViewport : undefined
    if (!viewport) return

    const update = () => {
      setMetrics({ height: viewport.height, offsetTop: viewport.offsetTop })
    }

    update()
    viewport.addEventListener('resize', update)
    // The visual viewport also scrolls independently while the keyboard is up.
    viewport.addEventListener('scroll', update)
    return () => {
      viewport.removeEventListener('resize', update)
      viewport.removeEventListener('scroll', update)
    }
  }, [enabled])

  return metrics
}
