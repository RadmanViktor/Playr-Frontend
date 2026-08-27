import { API_BASE_URL, ApiError, parseErrorMessage } from './http'
import type { PostFeedItem } from './postsApi'

export type ProfileStatus = 'Online' | 'LookingForGame' | 'Busy' | 'Offline'
export type PlayStyle = 'Competitive' | 'Chill'

export interface ProfileData {
  userId: string
  username: string
  displayName: string
  bio: string | null
  avatarUrl: string | null
  region: string | null
  languages: string[]
  platforms: string[]
  externalLinks: Record<string, string>
  currentlyPlayingGames: string[]
  status: ProfileStatus
  lookingForGameId: string | null
  lookingForGameName: string | null
  lookingForPlayStyle: PlayStyle | null
  createdAt: string
  updatedAt: string
}

export interface UpdateProfileData {
  displayName: string
  bio?: string | null
  region?: string | null
  languages: string[]
  platforms: string[]
  externalLinks: Record<string, string>
  currentlyPlayingGames: string[]
}

export interface UpdateStatusData {
  status: ProfileStatus
  lookingForGameId?: string | null
  lookingForPlayStyle?: PlayStyle | null
}

export async function getProfile(username: string): Promise<ProfileData> {
  const response = await fetch(`${API_BASE_URL}/api/profiles/${username}`)
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

export type RelationshipStatus = 'None' | 'InvitePending' | 'Friends'

export interface LookingForGamePlayer {
  userId: string
  username: string
  displayName: string
  avatarUrl: string | null
  lookingForGameId: string | null
  lookingForGameName: string | null
  lookingForPlayStyle: PlayStyle | null
  relationshipStatus: RelationshipStatus
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
