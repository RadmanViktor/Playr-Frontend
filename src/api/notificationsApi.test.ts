import { describe, it, expect, vi, beforeEach } from 'vitest'
import { deleteNotification, clearAllNotifications } from './notificationsApi'
import { ApiError } from './http'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

beforeEach(() => { mockFetch.mockReset() })

describe('deleteNotification', () => {
  it('sends DELETE with bearer token to the notification id endpoint', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 204, json: async () => ({}) })
    await deleteNotification('tok', 'n1')
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/notifications/n1'),
      expect.objectContaining({ method: 'DELETE', headers: expect.objectContaining({ Authorization: 'Bearer tok' }) }),
    )
  })

  it('throws ApiError when the request fails', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404, json: async () => ({ error: 'Notification was not found.' }) })
    await expect(deleteNotification('tok', 'n1')).rejects.toBeInstanceOf(ApiError)
  })
})

describe('clearAllNotifications', () => {
  it('sends DELETE with bearer token to the notifications collection endpoint', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 204, json: async () => ({}) })
    await clearAllNotifications('tok')
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/notifications$/),
      expect.objectContaining({ method: 'DELETE', headers: expect.objectContaining({ Authorization: 'Bearer tok' }) }),
    )
  })

  it('throws ApiError when the request fails', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({ error: 'Server error.' }) })
    await expect(clearAllNotifications('tok')).rejects.toBeInstanceOf(ApiError)
  })
})
