import { API_BASE_URL, ApiError, parseErrorMessage } from './http'

export interface SteamAccount {
  userId: string
  steamId: string
  displayName: string | null
  avatarUrl: string | null
  isPublic: boolean
  linkedAt: string
  lastSyncedAt: string | null
}

export interface SteamGame {
  appId: number
  name: string
  iconUrl: string | null
  playtimeForeverMinutes: number
  playtimeRecentMinutes: number
}

export interface SteamAchievement {
  apiName: string
  displayName: string | null
  iconUrl: string | null
  iconGrayUrl: string | null
  achieved: boolean
  unlockedAt: string | null
}

export async function getSteamStatus(token: string): Promise<SteamAccount | null> {
  const response = await fetch(`${API_BASE_URL}/api/steam/status`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (response.status === 204) {
    return null
  }
  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Failed to load Steam status.')
    throw new ApiError(response.status, message)
  }
  return response.json()
}

export async function startSteamLink(token: string): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/api/steam/link`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Failed to start Steam linking.')
    throw new ApiError(response.status, message)
  }
  const data = (await response.json()) as { redirectUrl: string }
  return data.redirectUrl
}

export async function unlinkSteam(token: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/steam/link`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Failed to unlink Steam account.')
    throw new ApiError(response.status, message)
  }
}

export async function getSteamGames(userId: string): Promise<SteamGame[]> {
  const response = await fetch(`${API_BASE_URL}/api/steam/games/${userId}`)
  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Failed to load Steam games.')
    throw new ApiError(response.status, message)
  }
  return response.json()
}

export async function getSteamAchievements(userId: string, appId: number): Promise<SteamAchievement[]> {
  const response = await fetch(`${API_BASE_URL}/api/steam/games/${userId}/${appId}/achievements`)
  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Failed to load Steam achievements.')
    throw new ApiError(response.status, message)
  }
  return response.json()
}
