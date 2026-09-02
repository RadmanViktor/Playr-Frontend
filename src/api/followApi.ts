import { API_BASE_URL, ApiError, parseErrorMessage } from './http'
import { authenticatedFetch as fetch } from './session'

export interface Follow {
  userId: string
  username: string
  displayName: string
  avatarUrl: string | null
  followingSince: string
}

export interface FollowCounts {
  followersCount: number
  followingCount: number
}

export interface FollowStatus {
  isFollowing: boolean
}

function authHeaders(token: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }
}

export async function followUser(token: string, userId: string): Promise<Follow> {
  const response = await fetch(`${API_BASE_URL}/api/follows/${userId}`, {
    method: 'POST',
    headers: authHeaders(token),
  })
  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Failed to follow player.')
    throw new ApiError(response.status, message)
  }
  return response.json()
}

export async function unfollowUser(token: string, userId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/follows/${userId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })
  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Failed to unfollow player.')
    throw new ApiError(response.status, message)
  }
}

export async function getFollowStatus(token: string, userId: string): Promise<FollowStatus> {
  const response = await fetch(`${API_BASE_URL}/api/follows/${userId}/status`, {
    headers: authHeaders(token),
  })
  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Failed to load follow status.')
    throw new ApiError(response.status, message)
  }
  return response.json()
}

export async function getFollowCounts(token: string, userId: string): Promise<FollowCounts> {
  const response = await fetch(`${API_BASE_URL}/api/follows/${userId}/counts`, {
    headers: authHeaders(token),
  })
  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Failed to load follow counts.')
    throw new ApiError(response.status, message)
  }
  return response.json()
}

export async function getFollowers(token: string, userId: string): Promise<Follow[]> {
  const response = await fetch(`${API_BASE_URL}/api/follows/${userId}/followers`, {
    headers: authHeaders(token),
  })
  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Failed to load followers.')
    throw new ApiError(response.status, message)
  }
  return response.json()
}

export async function getFollowing(token: string, userId: string): Promise<Follow[]> {
  const response = await fetch(`${API_BASE_URL}/api/follows/${userId}/following`, {
    headers: authHeaders(token),
  })
  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Failed to load following.')
    throw new ApiError(response.status, message)
  }
  return response.json()
}
