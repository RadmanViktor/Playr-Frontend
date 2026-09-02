import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from './http'
import { getPublicLookingForGameSummary } from './publicLobbyApi'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

beforeEach(() => mockFetch.mockReset())

describe('getPublicLookingForGameSummary', () => {
  it('loads the public lobby without authentication', async () => {
    const summary = { totalCount: 0, featuredGame: null, players: [] }
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => summary })

    await expect(getPublicLookingForGameSummary()).resolves.toEqual(summary)
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/profiles/looking-for-game/public'),
    )
  })

  it('throws ApiError when the public lobby request fails', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 503,
      json: async () => ({ error: 'Unavailable' }),
    })

    await expect(getPublicLookingForGameSummary()).rejects.toBeInstanceOf(ApiError)
  })
})
