import { useEffect } from 'react'

/**
 * Reference-counted body scroll lock.
 *
 * Multiple overlays can be open at once (e.g. MediaLightbox on top of
 * CreatePostModal). A naive lock/unlock per overlay would unlock as soon as the
 * topmost one closes, so we only touch the DOM on the 0 -> 1 and 1 -> 0
 * transitions.
 *
 * On iOS Safari `overflow: hidden` on <body> is not reliably honoured, so we
 * additionally pin the body with `position: fixed` and restore the scroll
 * offset on unlock. This also fixes the background losing its scroll position
 * when an overlay closes.
 */

let lockCount = 0
let restore: (() => void) | null = null

function applyLock() {
  const body = document.body
  const scrollY = window.scrollY
  const previous = {
    overflow: body.style.overflow,
    position: body.style.position,
    top: body.style.top,
    left: body.style.left,
    right: body.style.right,
    width: body.style.width,
    paddingRight: body.style.paddingRight,
  }

  // Compensate for the disappearing scrollbar so the layout does not shift.
  // On mobile (overlay scrollbars) this is 0, so it is a no-op there.
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
  if (scrollbarWidth > 0) {
    const currentPadding = parseFloat(window.getComputedStyle(body).paddingRight) || 0
    body.style.paddingRight = `${currentPadding + scrollbarWidth}px`
  }

  body.style.overflow = 'hidden'
  body.style.position = 'fixed'
  body.style.top = `${-scrollY}px`
  body.style.left = '0'
  body.style.right = '0'
  body.style.width = '100%'

  restore = () => {
    body.style.overflow = previous.overflow
    body.style.position = previous.position
    body.style.top = previous.top
    body.style.left = previous.left
    body.style.right = previous.right
    body.style.width = previous.width
    body.style.paddingRight = previous.paddingRight
    window.scrollTo(0, scrollY)
  }
}

function lock() {
  lockCount += 1
  if (lockCount === 1) applyLock()
}

function unlock() {
  lockCount = Math.max(0, lockCount - 1)
  if (lockCount === 0 && restore) {
    restore()
    restore = null
  }
}

export function useBodyScrollLock(enabled = true) {
  useEffect(() => {
    if (!enabled) return
    lock()
    return unlock
  }, [enabled])
}

/** Test-only helper so suites can assert a clean slate between cases. */
export function __resetBodyScrollLock() {
  if (restore) restore()
  restore = null
  lockCount = 0
}
