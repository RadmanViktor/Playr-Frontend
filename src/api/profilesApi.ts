import { API_BASE_URL, ApiError, parseErrorMessage } from './http'
import type { PostFeedItem } from './postsApi'

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
  lookingForPlayers: boolean
  createdAt: string
  updatedAt: string
}

export interface UpdateProfileData {
  displayName: string
  bio?: string | null
  avatarUrl?: string | null
  region?: string | null
  languages: string[]
  platforms: string[]
  externalLinks: Record<string, string>
  currentlyPlayingGames: string[]
  lookingForPlayers: boolean
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
