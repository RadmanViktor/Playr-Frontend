import { API_BASE_URL, ApiError, parseErrorMessage } from './http'

export type Mood = 'Enjoying' | 'Frustrated' | 'Completed' | 'NeedHelp'

export function resolveMediaUrl(url: string | null): string | null {
  if (!url) return null
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return `${API_BASE_URL}${url}`
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
  mediaUrl: string | null
  mediaType: string | null
  createdAt: string
  likesCount: number
  likedByCurrentUser: boolean
  commentsCount: number
}

export async function createPost(
  token: string,
  data: { gameId: string; textContent: string; mood?: string | null; media?: File | null },
  onProgress?: (percent: number) => void
): Promise<PostFeedItem> {
  const form = new FormData()
  form.append('GameId', data.gameId)
  form.append('TextContent', data.textContent)
  if (data.mood) form.append('Mood', data.mood)
  if (data.media) form.append('Media', data.media)

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

export async function updatePost(
  token: string,
  postId: string,
  data: { textContent: string; mood?: string | null; media?: File | null; removeMedia?: boolean }
): Promise<PostFeedItem> {
  const form = new FormData()
  form.append('TextContent', data.textContent)
  if (data.mood) form.append('Mood', data.mood)
  if (data.media) form.append('Media', data.media)
  if (data.removeMedia) form.append('RemoveMedia', 'true')

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
