import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getProfile, getProfilePosts, updateProfile } from './profilesApi'
import { ApiError } from './http'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

beforeEach(() => { mockFetch.mockReset() })

const sampleProfile = {
  userId: 'u1', username: 'player', displayName: 'Player One', bio: 'Hi',
  avatarUrl: null, region: 'EU', languages: ['English'], platforms: ['PC'],
  externalLinks: { Steam: 'https://steam.com/player' }, currentlyPlayingGames: [],
  lookingForGameId: null, lookingForGameName: null, lookingForPlayStyle: null,
  status: 'Online', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
}

describe('getProfile', () => {
  it('returns profile on success', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => sampleProfile })
    const result = await getProfile('player')
    expect(result.username).toBe('player')
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/profiles/player'),
      expect.anything(),
    )
  })

  it('throws ApiError on 404', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404, json: async () => ({ error: 'Profile was not found.' }) })
    await expect(getProfile('nobody')).rejects.toBeInstanceOf(ApiError)
  })
})

describe('getProfilePosts', () => {
  it('returns posts array on success', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => [] })
    const result = await getProfilePosts('player')
    expect(result).toEqual([])
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/profiles/player/posts'))
  })
})

describe('updateProfile', () => {
  it('sends PUT with bearer token and returns updated profile', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => sampleProfile })
    const data = { displayName: 'New Name', languages: [], platforms: ['PC'], externalLinks: {}, currentlyPlayingGames: [] }
    const result = await updateProfile('my-token', data)
    expect(result.displayName).toBe('Player One')
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/profiles/me'),
      expect.objectContaining({ method: 'PUT', headers: expect.objectContaining({ Authorization: 'Bearer my-token' }) })
    )
  })

  it('throws ApiError on 400', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 400, json: async () => ({ error: 'Display name is required.' }) })
    await expect(updateProfile('tok', { displayName: '', languages: [], platforms: [], externalLinks: {}, currentlyPlayingGames: [] })).rejects.toBeInstanceOf(ApiError)
  })
})
