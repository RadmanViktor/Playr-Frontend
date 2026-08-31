import { API_BASE_URL, ApiError, parseErrorMessage } from './http'

export interface ChatParticipant {
  userId: string
  username: string
  displayName: string
  avatarUrl: string | null
}

export type ConversationType = 'Direct' | 'Group'

export interface Conversation {
  id: string
  type: ConversationType
  title: string | null
  // Null for Group conversations - use `participants` to build a display name instead.
  otherParticipant: ChatParticipant | null
  lastMessage: string | null
  lastMessageAt: string | null
  createdAt: string
  updatedAt: string
  participants: ChatParticipant[]
  lfgGroupId: string | null
}

/** Participants excluding the given user id - the "other side" of a Direct or Group chat. */
export function getOtherParticipants(conversation: Conversation, currentUserId?: string | null): ChatParticipant[] {
  return conversation.participants.filter((p) => p.userId !== currentUserId)
}

export interface ChatMessage {
  id: string
  conversationId: string
  senderUserId: string
  senderUsername: string
  senderDisplayName: string
  senderAvatarUrl: string | null
  body: string
  mediaUrl: string | null
  mediaType: 'Image' | 'Video' | null
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

export async function sendMessage(
  token: string,
  conversationId: string,
  body: string,
  media?: File | null
): Promise<ChatMessage> {
  const form = new FormData()
  form.append('Body', body)
  if (media) form.append('Media', media)

  const response = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  })
  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Failed to send message.')
    throw new ApiError(response.status, message)
  }
  return response.json()
}
