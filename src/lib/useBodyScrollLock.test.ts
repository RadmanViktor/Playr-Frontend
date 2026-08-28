import { describe, it, expect, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useBodyScrollLock, __resetBodyScrollLock } from './useBodyScrollLock'

afterEach(() => {
  __resetBodyScrollLock()
  document.body.removeAttribute('style')
})

describe('useBodyScrollLock', () => {
  it('locks the body while mounted', () => {
    renderHook(() => useBodyScrollLock())

    expect(document.body.style.overflow).toBe('hidden')
    expect(document.body.style.position).toBe('fixed')
  })

  it('restores the body when unmounted', () => {
    const { unmount } = renderHook(() => useBodyScrollLock())
    unmount()

    expect(document.body.style.overflow).toBe('')
    expect(document.body.style.position).toBe('')
  })

  it('stays locked until every overlay has unmounted', () => {
    const first = renderHook(() => useBodyScrollLock())
    const second = renderHook(() => useBodyScrollLock())

    second.unmount()
    // The outer overlay is still open, so the page must not become scrollable.
    expect(document.body.style.overflow).toBe('hidden')

    first.unmount()
    expect(document.body.style.overflow).toBe('')
  })

  it('restores the previous scroll position on unlock', () => {
    window.scrollY = 250
    const { unmount } = renderHook(() => useBodyScrollLock())

    expect(document.body.style.top).toBe('-250px')

    let scrolledBackTo: number | null = null
    window.scrollTo = ((_x: number, y: number) => {
      scrolledBackTo = y
    }) as typeof window.scrollTo

    unmount()
    expect(scrolledBackTo).toBe(250)
  })

  it('does nothing when disabled', () => {
    renderHook(() => useBodyScrollLock(false))

    expect(document.body.style.overflow).toBe('')
  })
})
