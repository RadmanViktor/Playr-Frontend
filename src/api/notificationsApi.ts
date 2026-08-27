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
