import { API_BASE_URL, ApiError, parseErrorMessage } from './http'

export interface UserBadge {
  type: string
  level: string
  unlockedAt: string
}

export interface UserBadges {
  userId: string
  badges: UserBadge[]
  activeBadgeType: string | null
  activeBadgeLevel: string | null
}

export async function getMyBadges(token: string): Promise<UserBadges> {
  const response = await fetch(`${API_BASE_URL}/api/badges/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Failed to load badges.')
    throw new ApiError(response.status, message)
  }
  return response.json()
}

export async function getUserBadges(userId: string): Promise<UserBadges> {
  const response = await fetch(`${API_BASE_URL}/api/badges/user/${userId}`)
  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Failed to load badges.')
    throw new ApiError(response.status, message)
  }
  return response.json()
}

/** Pass `null` to clear the active badge (stop displaying a badge ring). */
export async function setActiveBadge(token: string, badgeType: string | null): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/badges/active`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ badgeType }),
  })
  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Failed to update active badge.')
    throw new ApiError(response.status, message)
  }
}
