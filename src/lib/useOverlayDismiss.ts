import { useCallback, useEffect, useRef } from 'react'
import type { PointerEvent as ReactPointerEvent, MouseEvent as ReactMouseEvent } from 'react'

interface UseOverlayDismissOptions {
  /** Called when the user dismisses the overlay via backdrop tap or Escape. */
  onDismiss: () => void
  /** Set to false to opt out of Escape handling. Defaults to true. */
  closeOnEscape?: boolean
}

interface OverlayDismissBindings {
  onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void
  onClick: (event: ReactMouseEvent<HTMLElement>) => void
}

/**
 * Backdrop dismissal that survives touch gestures.
 *
 * A plain `onClick={onClose}` on the backdrop fires whenever a gesture *ends*
 * on the backdrop, even if it started inside the panel. On mobile that means a
 * scroll or text-selection drag that drifts past the panel edge silently
 * destroys unsaved form state.
 *
 * We require the gesture to both start and end on the backdrop itself.
 */
export function useOverlayDismiss({
  onDismiss,
  closeOnEscape = true,
}: UseOverlayDismissOptions): { backdropProps: OverlayDismissBindings } {
  // Ref rather than state: this must not trigger a re-render mid-gesture.
  const pointerDownOnBackdrop = useRef(false)

  const onPointerDown = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    pointerDownOnBackdrop.current = event.target === event.currentTarget
  }, [])

  const onClick = useCallback(
    (event: ReactMouseEvent<HTMLElement>) => {
      const startedAndEndedOnBackdrop =
        pointerDownOnBackdrop.current && event.target === event.currentTarget
      pointerDownOnBackdrop.current = false
      if (startedAndEndedOnBackdrop) onDismiss()
    },
    [onDismiss],
  )

  useEffect(() => {
    if (!closeOnEscape) return
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onDismiss()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [closeOnEscape, onDismiss])

  return { backdropProps: { onPointerDown, onClick } }
}
