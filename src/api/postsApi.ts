import { API_BASE_URL, ApiError, parseErrorMessage } from './http'

export type Mood = 'Enjoying' | 'Frustrated' | 'Completed' | 'NeedHelp'

export type PostScope = 'Feed' | 'Profile'

// Lives in ./http next to API_BASE_URL; re-exported here for existing callers.
export { resolveMediaUrl } from './http'

export interface PostMediaItem {
  id: string
  url: string
  mediaType: string
  sortOrder: number
}

export interface MentionItem {
  userId: string
  username: string
  displayName: string
}

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
  scope: PostScope
  media: PostMediaItem[]
  createdAt: string
  likesCount: number
  likedByCurrentUser: boolean
  commentsCount: number
  mentions: MentionItem[]
}

export async function createPost(
  token: string,
  data: { gameId: string; textContent: string; mood?: string | null; media?: File[]; mentionedUserIds?: string[]; scope?: PostScope },
  onProgress?: (percent: number) => void
): Promise<PostFeedItem> {
  const form = new FormData()
  form.append('GameId', data.gameId)
  form.append('TextContent', data.textContent)
  if (data.mood) form.append('Mood', data.mood)
  if (data.scope) form.append('Scope', data.scope)
  for (const file of data.media ?? []) form.append('Media', file)
  for (const userId of data.mentionedUserIds ?? []) form.append('MentionedUserIds', userId)

  if (!onProgress) {
    const response = await fetch(`${API_BASE_URL}/api/posts`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    })
    if (!response.ok) {
      const message = await parseErrorMessage(response, 'Failed to create post.')
      throw new ApiError(response.status, message)
    }
    return response.json()
  }

  return new Promise<PostFeedItem>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${API_BASE_URL}/api/posts`)
    xhr.setRequestHeader('Authorization', `Bearer ${token}`)

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100))
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText))
        } catch {
          reject(new ApiError(xhr.status, 'Failed to parse response.'))
        }
      } else {
        let message = 'Failed to create post.'
        try {
          const body = JSON.parse(xhr.responseText)
          if (typeof body?.error === 'string') message = body.error
        } catch {
          // keep fallback message
        }
        reject(new ApiError(xhr.status, message))
      }
    }

    xhr.onerror = () => reject(new ApiError(0, 'Failed to create post.'))
    xhr.send(form)
  })
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

export async function getPost(postId: string, token?: string | null): Promise<PostFeedItem> {
  const response = await fetch(`${API_BASE_URL}/api/posts/${postId}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  })
  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Failed to load post.')
    throw new ApiError(response.status, message)
  }
  return response.json()
}

export async function updatePost(
  token: string,
  postId: string,
  data: { textContent: string; mood?: string | null; media?: File[]; removeMediaIds?: string[] }
): Promise<PostFeedItem> {
  const form = new FormData()
  form.append('TextContent', data.textContent)
  if (data.mood) form.append('Mood', data.mood)
  for (const file of data.media ?? []) form.append('Media', file)
  for (const id of data.removeMediaIds ?? []) form.append('RemoveMediaIds', id)

  const response = await fetch(`${API_BASE_URL}/api/posts/${postId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
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
