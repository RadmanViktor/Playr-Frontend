import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  authenticatedFetch,
  clearAccessToken,
  refreshAccessToken,
  setAccessToken,
} from './session'
import { API_BASE_URL } from './http'

const mockFetch = vi.fn()

describe('session', () => {
  beforeEach(() => {
    mockFetch.mockReset()
    vi.stubGlobal('fetch', mockFetch)
    clearAccessToken()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('retries an authenticated request after refreshing on 401', async () => {
    setAccessToken('expired', '2026-01-01T00:00:00Z')
    mockFetch
      .mockResolvedValueOnce({ ok: false, status: 401 })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ accessToken: 'fresh', expiresAt: '2099-01-01T00:00:00Z' }),
      })
      .mockResolvedValueOnce({ ok: true, status: 200 })

    const response = await authenticatedFetch(`${API_BASE_URL}/api/auth/me`, {
      headers: { Authorization: 'Bearer expired' },
    })

    expect(response.ok).toBe(true)
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      `${API_BASE_URL}/api/auth/refresh`,
      expect.objectContaining({ credentials: 'include' })
    )
    expect(mockFetch).toHaveBeenNthCalledWith(
      3,
      `${API_BASE_URL}/api/auth/me`,
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer fresh' }) })
    )
  })

  it('uses one refresh request for concurrent callers', async () => {
    let resolveRefresh!: (value: unknown) => void
    mockFetch.mockImplementation((url: string) => {
      if (url.endsWith('/api/auth/refresh')) {
        return new Promise((resolve) => {
          resolveRefresh = resolve
        })
      }
      return Promise.resolve({ ok: true, status: 200 })
    })

    const first = refreshAccessToken()
    const second = refreshAccessToken()
    await vi.waitFor(() => expect(resolveRefresh).toBeTypeOf('function'))
    resolveRefresh({
      ok: true,
      status: 200,
      json: async () => ({ accessToken: 'fresh', expiresAt: '2099-01-01T00:00:00Z' }),
    })

    await expect(Promise.all([first, second])).resolves.toEqual([
      { accessToken: 'fresh', expiresAt: '2099-01-01T00:00:00Z' },
      { accessToken: 'fresh', expiresAt: '2099-01-01T00:00:00Z' },
    ])
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('serializes refreshes across browser tabs', async () => {
    const request = vi.fn(async (_name: string, callback: () => Promise<unknown>) => callback())
    Object.defineProperty(navigator, 'locks', {
      configurable: true,
      value: { request },
    })
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ accessToken: 'fresh', expiresAt: '2099-01-01T00:00:00Z' }),
    })

    await refreshAccessToken()

    expect(request).toHaveBeenCalledWith('playr-refresh', expect.any(Function))
    Object.defineProperty(navigator, 'locks', {
      configurable: true,
      value: undefined,
    })
  })

  it('does not erase the current token when refresh fails because of a network error', async () => {
    setAccessToken('still-usable', '2099-01-01T00:00:00Z')
    mockFetch.mockRejectedValueOnce(new TypeError('network unavailable'))

    await expect(refreshAccessToken()).rejects.toThrow('network unavailable')

    mockFetch.mockResolvedValueOnce({ ok: true, status: 200 })
    await authenticatedFetch(`${API_BASE_URL}/api/auth/me`, {
      headers: { Authorization: 'Bearer still-usable' },
    })
    expect(mockFetch).toHaveBeenLastCalledWith(
      `${API_BASE_URL}/api/auth/me`,
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer still-usable' }),
      })
    )
  })

  it('does not restore a token when logout occurs during refresh', async () => {
    setAccessToken('old', '2026-01-01T00:00:00Z')
    let resolveRefresh!: (value: unknown) => void
    mockFetch.mockReturnValueOnce(new Promise((resolve) => {
      resolveRefresh = resolve
    }))

    const refresh = refreshAccessToken()
    await Promise.resolve()
    clearAccessToken()
    resolveRefresh({
      ok: true,
      status: 200,
      json: async () => ({ accessToken: 'stale', expiresAt: '2099-01-01T00:00:00Z' }),
    })

    await expect(refresh).rejects.toMatchObject({ status: 401 })
    expect(mockFetch).toHaveBeenCalledOnce()
  })

  it('does not clear a newer login when an old refresh returns 401', async () => {
    setAccessToken('old', '2026-01-01T00:00:00Z')
    let resolveRefresh!: (value: unknown) => void
    mockFetch.mockReturnValueOnce(new Promise((resolve) => {
      resolveRefresh = resolve
    }))

    const refresh = refreshAccessToken()
    await vi.waitFor(() => expect(resolveRefresh).toBeTypeOf('function'))
    setAccessToken('new-login', '2099-01-01T00:00:00Z')
    resolveRefresh({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Expired.' }),
    })

    await expect(refresh).resolves.toEqual({
      accessToken: 'new-login',
      expiresAt: '2099-01-01T00:00:00Z',
    })
  })
})
