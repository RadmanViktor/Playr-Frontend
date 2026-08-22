import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPost, getFeed } from './postsApi'
import { ApiError } from './http'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

beforeEach(() => { mockFetch.mockReset() })

const samplePost = {
  id: '1', authorId: 'a1', authorUsername: 'player', authorDisplayName: 'Player',
  authorAvatarUrl: null, gameId: 'g1', gameName: 'Hollow Knight', gameCoverImageUrl: null,
  textContent: 'Cleared it!', mood: 'Enjoying', createdAt: new Date().toISOString(),
}

describe('createPost', () => {
  it('sends bearer token and returns post on 201', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 201, json: async () => samplePost })
    const result = await createPost('my-token', { gameId: 'g1', textContent: 'Cleared it!', mood: 'Enjoying' })
    expect(result.textContent).toBe('Cleared it!')
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/posts'),
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer my-token' }) })
    )
  })

  it('throws ApiError on 400', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 400, json: async () => ({ error: 'Game was not found.' }) })
    await expect(createPost('tok', { gameId: 'bad', textContent: 'Hi', mood: null })).rejects.toBeInstanceOf(ApiError)
  })
})

describe('getFeed', () => {
  it('returns list of posts', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => [samplePost] })
    const feed = await getFeed()
    expect(feed).toHaveLength(1)
    expect(feed[0].authorUsername).toBe('player')
  })
})
