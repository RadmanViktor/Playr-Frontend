import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useIdleTimer } from './useIdleTimer'

const CHECK_INTERVAL_MS = 15_000

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useIdleTimer', () => {
  it('does not fire onIdle before the timeout elapses', () => {
    const onIdle = vi.fn()
    const onActive = vi.fn()
    renderHook(() => useIdleTimer({ timeoutMs: 60_000, onIdle, onActive, enabled: true }))

    act(() => {
      vi.advanceTimersByTime(30_000)
    })

    expect(onIdle).not.toHaveBeenCalled()
  })

  it('fires onIdle once the timeout elapses without activity', () => {
    const onIdle = vi.fn()
    const onActive = vi.fn()
    renderHook(() => useIdleTimer({ timeoutMs: 60_000, onIdle, onActive, enabled: true }))

    act(() => {
      vi.advanceTimersByTime(60_000 + CHECK_INTERVAL_MS)
    })

    expect(onIdle).toHaveBeenCalledTimes(1)
  })

  it('does not fire onIdle again on subsequent checks while still idle', () => {
    const onIdle = vi.fn()
    const onActive = vi.fn()
    renderHook(() => useIdleTimer({ timeoutMs: 60_000, onIdle, onActive, enabled: true }))

    act(() => {
      vi.advanceTimersByTime(60_000 + CHECK_INTERVAL_MS * 3)
    })

    expect(onIdle).toHaveBeenCalledTimes(1)
  })

  it('resets the idle timer when activity is observed', () => {
    const onIdle = vi.fn()
    const onActive = vi.fn()
    renderHook(() => useIdleTimer({ timeoutMs: 60_000, onIdle, onActive, enabled: true }))

    act(() => {
      vi.advanceTimersByTime(45_000)
      window.dispatchEvent(new Event('mousemove'))
      vi.advanceTimersByTime(45_000)
    })

    expect(onIdle).not.toHaveBeenCalled()
  })

  it('fires onActive when activity resumes after going idle', () => {
    const onIdle = vi.fn()
    const onActive = vi.fn()
    renderHook(() => useIdleTimer({ timeoutMs: 60_000, onIdle, onActive, enabled: true }))

    act(() => {
      vi.advanceTimersByTime(60_000 + CHECK_INTERVAL_MS)
    })
    expect(onIdle).toHaveBeenCalledTimes(1)

    act(() => {
      window.dispatchEvent(new Event('keydown'))
    })

    expect(onActive).toHaveBeenCalledTimes(1)
  })

  it('does not track activity or fire callbacks while disabled', () => {
    const onIdle = vi.fn()
    const onActive = vi.fn()
    renderHook(() => useIdleTimer({ timeoutMs: 60_000, onIdle, onActive, enabled: false }))

    act(() => {
      vi.advanceTimersByTime(120_000)
    })

    expect(onIdle).not.toHaveBeenCalled()
    expect(onActive).not.toHaveBeenCalled()
  })
})
