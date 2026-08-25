import { API_BASE_URL, ApiError, parseErrorMessage } from './http'

export interface Friend {
  userId: string
  username: string
  displayName: string
  avatarUrl: string | null
  friendsSince: string
}

export async function getFriends(token: string): Promise<Friend[]> {
  const response = await fetch(`${API_BASE_URL}/api/friends`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Failed to load friends.')
    throw new ApiError(response.status, message)
  }
  return response.json()
}
