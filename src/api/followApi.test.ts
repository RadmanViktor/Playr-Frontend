import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  followUser,
  unfollowUser,
  getFollowStatus,
  getFollowCounts,
  getFollowers,
  getFollowing,
} from './followApi'
import { ApiError } from './http'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

beforeEach(() => { mockFetch.mockReset() })

const sampleFollow = {
  userId: 'u2',
  username: 'friend',
  displayName: 'Friend',
  avatarUrl: null,
  followingSince: new Date().toISOString(),
}

describe('followUser', () => {
  it('sends POST with bearer token and returns follow', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 200, json: async () => sampleFollow })
    const result = await followUser('tok', 'u2')
    expect(result.userId).toBe('u2')
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/follows/u2'),
      expect.objectContaining({ method: 'POST', headers: expect.objectContaining({ Authorization: 'Bearer tok' }) })
    )
  })

  it('throws ApiError on 400', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 400, json: async () => ({ error: 'You cannot follow yourself.' }) })
    await expect(followUser('tok', 'u1')).rejects.toBeInstanceOf(ApiError)
  })
})

describe('unfollowUser', () => {
  it('sends DELETE with bearer token', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 204, json: async () => ({}) })
    await unfollowUser('tok', 'u2')
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/follows/u2'),
      expect.objectContaining({ method: 'DELETE', headers: expect.objectContaining({ Authorization: 'Bearer tok' }) })
    )
  })
})

describe('getFollowStatus', () => {
  it('returns isFollowing', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ isFollowing: true }) })
    const result = await getFollowStatus('tok', 'u2')
    expect(result.isFollowing).toBe(true)
  })
})

describe('getFollowCounts', () => {
  it('returns follower and following counts', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ followersCount: 5, followingCount: 2 }) })
    const result = await getFollowCounts('tok', 'u2')
    expect(result.followersCount).toBe(5)
    expect(result.followingCount).toBe(2)
  })
})

describe('getFollowers', () => {
  it('returns list of followers', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => [sampleFollow] })
    const result = await getFollowers('tok', 'u1')
    expect(result).toHaveLength(1)
  })
})

describe('getFollowing', () => {
  it('returns list of following', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => [sampleFollow] })
    const result = await getFollowing('tok', 'u1')
    expect(result).toHaveLength(1)
  })
})
