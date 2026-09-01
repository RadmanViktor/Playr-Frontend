import { API_BASE_URL, ApiError, parseErrorMessage } from './http'
import type { PostFeedItem } from './postsApi'

export type ProfileStatus = 'Online' | 'LookingForGame' | 'Busy' | 'Inactive' | 'Offline'
export type PlayStyle = 'Competitive' | 'Chill'
export type RelationshipStatus = 'None' | 'InvitePending' | 'Friends'
export type TypicalPlayTime = 'Evenings' | 'Weekends' | 'Daytime' | 'Varies'

export interface ProfileData {
  userId: string
  username: string
  displayName: string
  bio: string | null
  avatarUrl: string | null
  coverImageUrl: string | null
  coverImagePositionX: number
  coverImagePositionY: number
  region: string | null
  languages: string[]
  platforms: string[]
  genres: string[]
  externalLinks: Record<string, string>
  status: ProfileStatus
  lookingForGameId: string | null
  lookingForGameName: string | null
  lookingForPlayStyle: PlayStyle | null
  lookingForGameNote: string | null
  typicalPlayTimes: TypicalPlayTime[]
  hasCompletedOnboarding: boolean
  createdAt: string
  updatedAt: string
  relationshipStatus: RelationshipStatus | null
  pendingInvitationId: string | null
  activeBadgeType: string | null
  activeBadgeLevel: string | null
}

export interface UpdateProfileData {
  displayName: string
  bio?: string | null
  region?: string | null
  languages: string[]
  platforms: string[]
  genres: string[]
  externalLinks: Record<string, string>
  typicalPlayTimes?: TypicalPlayTime[]
}

export interface UpdateStatusData {
  status: ProfileStatus
  lookingForGameId?: string | null
  lookingForPlayStyle?: PlayStyle | null
  lookingForGameNote?: string | null
}

export async function getProfile(username: string, token?: string | null): Promise<ProfileData> {
  const response = await fetch(`${API_BASE_URL}/api/profiles/${username}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  })
  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Profile not found.')
    throw new ApiError(response.status, message)
  }
  return response.json()
}

export async function getProfilePosts(username: string, token?: string | null): Promise<PostFeedItem[]> {
  const response = await fetch(`${API_BASE_URL}/api/profiles/${username}/posts`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  })
  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Failed to load posts.')
    throw new ApiError(response.status, message)
  }
  return response.json()
}

export async function updateProfile(token: string, data: UpdateProfileData): Promise<ProfileData> {
  const response = await fetch(`${API_BASE_URL}/api/profiles/me`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Failed to update profile.')
    throw new ApiError(response.status, message)
  }
  return response.json()
}

export async function updateProfileStatus(token: string, data: UpdateStatusData): Promise<ProfileData> {
  const response = await fetch(`${API_BASE_URL}/api/profiles/me/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Failed to update status.')
    throw new ApiError(response.status, message)
  }
  return response.json()
}

export async function uploadAvatar(token: string, file: File): Promise<ProfileData> {
  const form = new FormData()
  form.append('Avatar', file)

  const response = await fetch(`${API_BASE_URL}/api/profiles/me/avatar`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  })
  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Failed to upload avatar.')
    throw new ApiError(response.status, message)
  }
  return response.json()
}

export async function uploadCoverImage(token: string, file: File): Promise<ProfileData> {
  const form = new FormData()
  form.append('CoverImage', file)

  const response = await fetch(`${API_BASE_URL}/api/profiles/me/cover-image`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  })
  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Failed to upload cover image.')
    throw new ApiError(response.status, message)
  }
  return response.json()
}

export async function updateCoverImagePosition(token: string, positionX: number, positionY: number): Promise<ProfileData> {
  const response = await fetch(`${API_BASE_URL}/api/profiles/me/cover-image-position`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ positionX, positionY }),
  })
  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Failed to update cover image position.')
    throw new ApiError(response.status, message)
  }
  return response.json()
}

export interface ProfileSearchResult {
  userId: string
  username: string
  displayName: string
  avatarUrl: string | null
}

export async function searchProfiles(query: string): Promise<ProfileSearchResult[]> {
  const response = await fetch(`${API_BASE_URL}/api/profiles/search?q=${encodeURIComponent(query)}`)
  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Search failed.')
    throw new ApiError(response.status, message)
  }
  return response.json()
}

export interface LookingForGamePlayer {
  userId: string
  username: string
  displayName: string
  avatarUrl: string | null
  lookingForGameId: string | null
  lookingForGameName: string | null
  lookingForPlayStyle: PlayStyle | null
  lookingForGameNote: string | null
  relationshipStatus: RelationshipStatus
  pendingInvitationId: string | null
}

export async function getLookingForGamePlayers(token: string): Promise<LookingForGamePlayer[]> {
  const response = await fetch(`${API_BASE_URL}/api/profiles/looking-for-game`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Failed to load players.')
    throw new ApiError(response.status, message)
  }
  return response.json()
}

export interface PlayingNowEntry {
  gameId: string
  gameName: string
  gameCoverImageUrl: string | null
  statusText: string | null
  createdAt: string
  updatedAt: string
}

export async function getPlayingNow(username: string): Promise<PlayingNowEntry[]> {
  const response = await fetch(`${API_BASE_URL}/api/profiles/${username}/playing-now`)
  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Failed to load playing now.')
    throw new ApiError(response.status, message)
  }
  return response.json()
}

export async function setPlayingNow(token: string, gameId: string, statusText?: string | null): Promise<PlayingNowEntry> {
  const response = await fetch(`${API_BASE_URL}/api/profiles/me/playing-now`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ gameId, statusText }),
  })
  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Failed to update playing now.')
    throw new ApiError(response.status, message)
  }
  return response.json()
}

export async function removePlayingNow(token: string, gameId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/profiles/me/playing-now/${gameId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Failed to remove playing now entry.')
    throw new ApiError(response.status, message)
  }
}
