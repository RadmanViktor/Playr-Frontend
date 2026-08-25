import { API_BASE_URL, ApiError, parseErrorMessage } from './http'

export interface ChatParticipant {
  userId: string
  username: string
  displayName: string
  avatarUrl: string | null
}

export interface Conversation {
  id: string
  otherParticipant: ChatParticipant
  lastMessage: string | null
  lastMessageAt: string | null
  createdAt: string
  updatedAt: string
}

export interface ChatMessage {
  id: string
  conversationId: string
  senderUserId: string
  senderUsername: string
  senderDisplayName: string
  senderAvatarUrl: string | null
  body: string
  createdAt: string
  readAt: string | null
}

function authHeaders(token: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }
}

export async function getConversations(token: string): Promise<Conversation[]> {
  const response = await fetch(`${API_BASE_URL}/api/conversations`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Failed to load conversations.')
    throw new ApiError(response.status, message)
  }
  return response.json()
}

export async function getOrCreateConversation(token: string, otherUserId: string): Promise<Conversation> {
  const response = await fetch(`${API_BASE_URL}/api/conversations/with/${otherUserId}`, {
    method: 'POST',
    headers: authHeaders(token),
  })
  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Failed to open chat.')
    throw new ApiError(response.status, message)
  }
  return response.json()
}

export async function getMessages(token: string, conversationId: string): Promise<ChatMessage[]> {
  const response = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}/messages`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Failed to load messages.')
    throw new ApiError(response.status, message)
  }
  return response.json()
}

export async function sendMessage(token: string, conversationId: string, body: string): Promise<ChatMessage> {
  const response = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ body }),
  })
  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Failed to send message.')
    throw new ApiError(response.status, message)
  }
  return response.json()
}
