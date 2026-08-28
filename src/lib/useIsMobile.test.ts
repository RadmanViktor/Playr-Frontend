import { describe, it, expect, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useIsMobile, MOBILE_MEDIA_QUERY } from './useIsMobile'
import { setMatchMedia, resetMatchMedia } from '../test-setup'

afterEach(() => resetMatchMedia())

describe('useIsMobile', () => {
  it('reports false on a wide viewport', () => {
    setMatchMedia(MOBILE_MEDIA_QUERY, false)
    const { result } = renderHook(() => useIsMobile())

    expect(result.current).toBe(false)
  })

  it('reports true below the sm breakpoint', () => {
    setMatchMedia(MOBILE_MEDIA_QUERY, true)
    const { result } = renderHook(() => useIsMobile())

    expect(result.current).toBe(true)
  })

  it('reacts to viewport changes', () => {
    setMatchMedia(MOBILE_MEDIA_QUERY, false)
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)

    act(() => setMatchMedia(MOBILE_MEDIA_QUERY, true))

    expect(result.current).toBe(true)
  })
})
