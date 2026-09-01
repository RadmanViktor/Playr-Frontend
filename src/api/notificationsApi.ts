import { API_BASE_URL, ApiError, parseErrorMessage } from './http'

export interface NotificationPreferences {
  chatSoundEnabled: boolean
  chatBrowserNotificationsEnabled: boolean
}

function authHeaders(token: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }
}

export async function getNotificationPreferences(token: string): Promise<NotificationPreferences> {
  const response = await fetch(`${API_BASE_URL}/api/notification-preferences`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Failed to load notification preferences.')
    throw new ApiError(response.status, message)
  }
  return response.json()
}

export async function updateNotificationPreferences(
  token: string,
  preferences: NotificationPreferences,
): Promise<NotificationPreferences> {
  const response = await fetch(`${API_BASE_URL}/api/notification-preferences`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(preferences),
  })
  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Failed to update notification preferences.')
    throw new ApiError(response.status, message)
  }
  return response.json()
}

export type NotificationType = 'PostMention' | 'CommentMention' | 'NewFollower' | 'BadgeUnlocked' | 'LfgApplicationReceived'

export interface NotificationActor {
  userId: string
  username: string
  displayName: string
  avatarUrl: string | null
}

export interface NotificationItem {
  id: string
  type: NotificationType
  isRead: boolean
  createdAt: string
  actor: NotificationActor
  postId: string | null
  commentId: string | null
  lfgGroupId: string | null
}

export interface NotificationFeed {
  items: NotificationItem[]
  hasMore: boolean
  unreadCount: number
}

export async function getNotifications(token: string, skip: number, take: number): Promise<NotificationFeed> {
  const response = await fetch(`${API_BASE_URL}/api/notifications?skip=${skip}&take=${take}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Failed to load notifications.')
    throw new ApiError(response.status, message)
  }
  return response.json()
}

export async function markNotificationRead(token: string, notificationId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/notifications/${notificationId}/read`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Failed to mark notification as read.')
    throw new ApiError(response.status, message)
  }
}

export async function markAllNotificationsRead(token: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/notifications/read-all`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Failed to mark notifications as read.')
    throw new ApiError(response.status, message)
  }
}

export async function deleteNotification(token: string, notificationId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/notifications/${notificationId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Failed to delete notification.')
    throw new ApiError(response.status, message)
  }
}

export async function clearAllNotifications(token: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/notifications`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Failed to clear notifications.')
    throw new ApiError(response.status, message)
  }
}

