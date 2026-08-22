import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getGames } from './gamesApi'
import { ApiError } from './http'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

beforeEach(() => { mockFetch.mockReset() })

describe('getGames', () => {
  it('returns games on success', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { id: 'abc', name: 'Hollow Knight', coverImageUrl: null, genre: null }
      ],
    })
    const result = await getGames()
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Hollow Knight')
  })

  it('throws ApiError on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Server error' }),
    })
    await expect(getGames()).rejects.toBeInstanceOf(ApiError)
  })
})
