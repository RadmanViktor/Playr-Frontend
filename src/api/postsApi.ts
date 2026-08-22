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

export async function getFeed(): Promise<PostFeedItem[]> {
  const response = await fetch(`${API_BASE_URL}/api/posts`)
  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Failed to load feed.')
    throw new ApiError(response.status, message)
  }
  return response.json()
}
