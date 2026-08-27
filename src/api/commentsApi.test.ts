import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getComments, createComment, updateComment, deleteComment, setCommentReaction, removeCommentReaction } from './commentsApi'
import { ApiError } from './http'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

beforeEach(() => { mockFetch.mockReset() })

const sampleReactions = {
  counts: { like: 0, haha: 0, wow: 0, sad: 0, angry: 0 },
  currentUserReaction: null,
}

const sampleComment = {
  id: 'c1', postId: 'p1', authorId: 'a1', authorUsername: 'player', authorDisplayName: 'Player',
  authorAvatarUrl: null, textContent: 'Nice!', createdAt: new Date().toISOString(), updatedAt: null,
  reactions: sampleReactions,
}

describe('getComments', () => {
  it('returns paged comments', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ items: [sampleComment], totalCount: 1, hasMore: false }) })
    const result = await getComments('p1', 0, 20)
    expect(result.items).toHaveLength(1)
    expect(result.items[0].textContent).toBe('Nice!')
  })
})

describe('createComment', () => {
  it('sends bearer token and returns created comment', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 201, json: async () => sampleComment })
    const result = await createComment('tok', 'p1', 'Nice!')
    expect(result.textContent).toBe('Nice!')
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/posts/p1/comments'),
      expect.objectContaining({ method: 'POST', headers: expect.objectContaining({ Authorization: 'Bearer tok' }) })
    )
  })

  it('throws ApiError on 400', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 400, json: async () => ({ error: 'Comment text is required.' }) })
    await expect(createComment('tok', 'p1', '')).rejects.toBeInstanceOf(ApiError)
  })
})

describe('updateComment', () => {
  it('sends PUT with bearer token and returns updated comment', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ ...sampleComment, textContent: 'Edited!' }) })
    const result = await updateComment('tok', 'p1', 'c1', 'Edited!')
    expect(result.textContent).toBe('Edited!')
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/posts/p1/comments/c1'),
      expect.objectContaining({ method: 'PUT', headers: expect.objectContaining({ Authorization: 'Bearer tok' }) })
    )
  })

  it('throws ApiError on 403', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 403, json: async () => ({ error: 'You are not allowed to edit this comment.' }) })
    await expect(updateComment('tok', 'p1', 'c1', 'x')).rejects.toBeInstanceOf(ApiError)
  })
})

describe('deleteComment', () => {
  it('sends DELETE with bearer token', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 204, json: async () => ({}) })
    await deleteComment('tok', 'p1', 'c1')
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/posts/p1/comments/c1'),
      expect.objectContaining({ method: 'DELETE', headers: expect.objectContaining({ Authorization: 'Bearer tok' }) })
    )
  })

  it('throws ApiError on 403', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 403, json: async () => ({ error: 'You are not allowed to delete this comment.' }) })
    await expect(deleteComment('tok', 'p1', 'c1')).rejects.toBeInstanceOf(ApiError)
  })
})

describe('setCommentReaction', () => {
  it('sends PUT with bearer token and type body, returns reactions', async () => {
    const reactions = { counts: { like: 1, haha: 0, wow: 0, sad: 0, angry: 0 }, currentUserReaction: 'Like' }
    mockFetch.mockResolvedValueOnce({ ok: true, status: 200, json: async () => reactions })
    const result = await setCommentReaction('tok', 'p1', 'c1', 'Like')
    expect(result.counts.like).toBe(1)
    expect(result.currentUserReaction).toBe('Like')
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/posts/p1/comments/c1/reactions'),
      expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({ Authorization: 'Bearer tok' }),
        body: JSON.stringify({ type: 'Like' }),
      })
    )
  })

  it('throws ApiError on 404', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404, json: async () => ({ error: 'Comment was not found.' }) })
    await expect(setCommentReaction('tok', 'p1', 'missing', 'Like')).rejects.toBeInstanceOf(ApiError)
  })
})

describe('removeCommentReaction', () => {
  it('sends DELETE with bearer token and returns reactions', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 200, json: async () => sampleReactions })
    const result = await removeCommentReaction('tok', 'p1', 'c1')
    expect(result.currentUserReaction).toBeNull()
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/posts/p1/comments/c1/reactions'),
      expect.objectContaining({ method: 'DELETE', headers: expect.objectContaining({ Authorization: 'Bearer tok' }) })
    )
  })

  it('throws ApiError on 404', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404, json: async () => ({ error: 'Comment was not found.' }) })
    await expect(removeCommentReaction('tok', 'p1', 'missing')).rejects.toBeInstanceOf(ApiError)
  })
})
