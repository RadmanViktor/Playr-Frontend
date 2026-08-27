import { API_BASE_URL, ApiError, parseErrorMessage } from './http'

export type FriendRequestStatus = 'Pending' | 'Accepted' | 'Declined' | 'Cancelled'

export interface FriendRequest {
  id: string
  senderUserId: string
  senderUsername: string
  senderDisplayName: string
  senderAvatarUrl: string | null
  recipientUserId: string
  recipientUsername: string
  recipientDisplayName: string
  recipientAvatarUrl: string | null
  status: FriendRequestStatus
  createdAt: string
  respondedAt: string | null
}

function authHeaders(token: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }
}

export async function sendFriendRequest(token: string, recipientUserId: string): Promise<FriendRequest> {
  const response = await fetch(`${API_BASE_URL}/api/friend-requests`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ recipientUserId }),
  })
  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Failed to send friend request.')
    throw new ApiError(response.status, message)
  }
  return response.json()
}

export async function getIncomingFriendRequests(token: string): Promise<FriendRequest[]> {
  const response = await fetch(`${API_BASE_URL}/api/friend-requests/incoming`, {
    headers: authHeaders(token),
  })
  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Failed to load friend requests.')
    throw new ApiError(response.status, message)
  }
  return response.json()
}

export async function getSentFriendRequests(token: string): Promise<FriendRequest[]> {
  const response = await fetch(`${API_BASE_URL}/api/friend-requests/sent`, {
    headers: authHeaders(token),
  })
  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Failed to load friend requests.')
    throw new ApiError(response.status, message)
  }
  return response.json()
}

export async function acceptFriendRequest(token: string, friendRequestId: string): Promise<FriendRequest> {
  const response = await fetch(`${API_BASE_URL}/api/friend-requests/${friendRequestId}/accept`, {
    method: 'POST',
    headers: authHeaders(token),
  })
  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Failed to accept friend request.')
    throw new ApiError(response.status, message)
  }
  return response.json()
}

export async function declineFriendRequest(token: string, friendRequestId: string): Promise<FriendRequest> {
  const response = await fetch(`${API_BASE_URL}/api/friend-requests/${friendRequestId}/decline`, {
    method: 'POST',
    headers: authHeaders(token),
  })
  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Failed to decline friend request.')
    throw new ApiError(response.status, message)
  }
  return response.json()
}

export async function cancelFriendRequest(token: string, friendRequestId: string): Promise<FriendRequest> {
  const response = await fetch(`${API_BASE_URL}/api/friend-requests/${friendRequestId}/cancel`, {
    method: 'POST',
    headers: authHeaders(token),
  })
  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Failed to cancel friend request.')
    throw new ApiError(response.status, message)
  }
  return response.json()
}
