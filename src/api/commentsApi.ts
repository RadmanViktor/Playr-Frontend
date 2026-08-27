import { API_BASE_URL, ApiError, parseErrorMessage } from './http'

export type ReactionType = 'Like' | 'Haha' | 'Wow' | 'Sad' | 'Angry'

export interface ReactionCounts {
  like: number
  haha: number
  wow: number
  sad: number
  angry: number
}

export interface CommentReactions {
  counts: ReactionCounts
  currentUserReaction: ReactionType | null
}

export interface CommentItem {
  id: string
  postId: string
  authorId: string
  authorUsername: string
  authorDisplayName: string
  authorAvatarUrl: string | null
  textContent: string
  createdAt: string
  updatedAt: string | null
  reactions: CommentReactions
}

export interface PagedComments {
  items: CommentItem[]
  totalCount: number
  hasMore: boolean
}

export async function getComments(postId: string, skip: number, take: number): Promise<PagedComments> {
  const response = await fetch(`${API_BASE_URL}/api/posts/${postId}/comments?skip=${skip}&take=${take}`)
  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Failed to load comments.')
    throw new ApiError(response.status, message)
  }
  return response.json()
}

export async function createComment(token: string, postId: string, textContent: string): Promise<CommentItem> {
  const response = await fetch(`${API_BASE_URL}/api/posts/${postId}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ textContent }),
  })
  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Failed to post comment.')
    throw new ApiError(response.status, message)
  }
  return response.json()
}

export async function updateComment(token: string, postId: string, commentId: string, textContent: string): Promise<CommentItem> {
  const response = await fetch(`${API_BASE_URL}/api/posts/${postId}/comments/${commentId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ textContent }),
  })
  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Failed to update comment.')
    throw new ApiError(response.status, message)
  }
  return response.json()
}

export async function deleteComment(token: string, postId: string, commentId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/posts/${postId}/comments/${commentId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Failed to delete comment.')
    throw new ApiError(response.status, message)
  }
}

export async function setCommentReaction(
  token: string,
  postId: string,
  commentId: string,
  type: ReactionType
): Promise<CommentReactions> {
  const response = await fetch(`${API_BASE_URL}/api/posts/${postId}/comments/${commentId}/reactions`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ type }),
  })
  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Failed to update reaction.')
    throw new ApiError(response.status, message)
  }
  return response.json()
}

export async function removeCommentReaction(
  token: string,
  postId: string,
  commentId: string
): Promise<CommentReactions> {
  const response = await fetch(`${API_BASE_URL}/api/posts/${postId}/comments/${commentId}/reactions`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Failed to remove reaction.')
    throw new ApiError(response.status, message)
  }
  return response.json()
}
