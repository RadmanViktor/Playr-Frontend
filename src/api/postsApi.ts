import { API_BASE_URL, ApiError, parseErrorMessage } from './http'

export type Mood = 'Enjoying' | 'Frustrated' | 'Completed' | 'NeedHelp'

export interface PostFeedItem {
  id: string
  authorId: string
  authorUsername: string
  authorDisplayName: string
  authorAvatarUrl: string | null
  gameId: string
  gameName: string
  gameCoverImageUrl: string | null
  textContent: string
  mood: string | null
  createdAt: string
  likesCount: number
  likedByCurrentUser: boolean
}

export async function createPost(
  token: string,
  data: { gameId: string; textContent: string; mood?: string | null }
): Promise<PostFeedItem> {
  const response = await fetch(`${API_BASE_URL}/api/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Failed to create post.')
    throw new ApiError(response.status, message)
  }
  return response.json()
}

export async function getFeed(token?: string | null): Promise<PostFeedItem[]> {
  const response = await fetch(`${API_BASE_URL}/api/posts`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  })
  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Failed to load feed.')
    throw new ApiError(response.status, message)
  }
  return response.json()
}

export async function updatePost(
  token: string,
  postId: string,
  data: { textContent: string; mood?: string | null }
): Promise<PostFeedItem> {
  const response = await fetch(`${API_BASE_URL}/api/posts/${postId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Failed to update post.')
    throw new ApiError(response.status, message)
  }
  return response.json()
}

export async function deletePost(token: string, postId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/posts/${postId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Failed to delete post.')
    throw new ApiError(response.status, message)
  }
}

export async function toggleLike(token: string, postId: string): Promise<{ likesCount: number; liked: boolean }> {
  const response = await fetch(`${API_BASE_URL}/api/posts/${postId}/like`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Failed to like post.')
    throw new ApiError(response.status, message)
  }
  return response.json()
}
