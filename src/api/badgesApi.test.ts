import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getMyBadges, getUserBadges, setActiveBadge } from './badgesApi'
import { ApiError } from './http'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

beforeEach(() => { mockFetch.mockReset() })

const sampleBadges = {
  userId: 'u1',
  badges: [
    { type: 'Poster', level: 'Bronze', unlockedAt: new Date().toISOString() },
    { type: 'Creator', level: 'Gold', unlockedAt: new Date().toISOString() },
  ],
  activeBadgeType: 'Creator',
  activeBadgeLevel: 'Gold',
}

describe('getMyBadges', () => {
  it('sends bearer token and returns badges', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 200, json: async () => sampleBadges })
    const result = await getMyBadges('tok')
    expect(result.badges).toHaveLength(2)
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/badges/me'),
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer tok' }) })
    )
  })

  it('throws ApiError on failure', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({ error: 'Unauthorized' }) })
    await expect(getMyBadges('tok')).rejects.toBeInstanceOf(ApiError)
  })
})

describe('getUserBadges', () => {
  it('returns badges for a given user id', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => sampleBadges })
    const result = await getUserBadges('u1')
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/badges/user/u1'))
    expect(result.activeBadgeType).toBe('Creator')
  })
})

describe('setActiveBadge', () => {
  it('sends PUT with the chosen badge type', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 204, json: async () => ({}) })
    await setActiveBadge('tok', 'Poster')
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/badges/active'),
      expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({ Authorization: 'Bearer tok' }),
        body: JSON.stringify({ badgeType: 'Poster' }),
      })
    )
  })

  it('sends null to clear the active badge', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 204, json: async () => ({}) })
    await setActiveBadge('tok', null)
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/badges/active'),
      expect.objectContaining({ body: JSON.stringify({ badgeType: null }) })
    )
  })

  it('throws ApiError on failure', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 400, json: async () => ({ error: 'Invalid badge type.' }) })
    await expect(setActiveBadge('tok', 'Nope')).rejects.toBeInstanceOf(ApiError)
  })
})
