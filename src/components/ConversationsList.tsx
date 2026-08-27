import { useEffect, useState } from 'react'
import { Card } from './ui/Card'
import { Avatar } from './ui/Avatar'
import { getConversations, type Conversation } from '../api/chatApi'
import { useAuth } from '../context/AuthContext'
import { useChat } from '../context/ChatContext'

function formatRelativeTime(dateString: string): string {
  const diffMs = Date.now() - new Date(dateString).getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  if (diffMin < 60) return `${Math.max(diffMin, 1)}m ago`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH}h ago`
  return `${Math.floor(diffH / 24)}d ago`
}

export function ConversationsList() {
  const { token } = useAuth()
  const { openConversation, error: chatError } = useChat()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    setIsLoading(true)
    setError(null)
    getConversations(token)
      .then(setConversations)
      .catch(() => setError('Failed to load chats.'))
      .finally(() => setIsLoading(false))
  }, [token])

  if (isLoading) return <p className="text-muted">Loading chats...</p>
  if (error) return <p className="text-frustrated">{error}</p>

  return (
    <div className="flex flex-col gap-4">
      {chatError && <p className="text-sm text-frustrated">{chatError}</p>}
      {conversations.length === 0 && (
        <Card>
          <p className="text-muted">No conversations yet. Start a chat with a friend to see it here.</p>
        </Card>
      )}

      {conversations.map((conversation) => (
        <Card
          key={conversation.id}
          className="flex cursor-pointer items-center justify-between gap-4"
          onClick={() => openConversation(conversation)}
        >
          <div className="flex min-w-0 items-center gap-3">
            <Avatar
              src={conversation.otherParticipant.avatarUrl ?? undefined}
              alt={conversation.otherParticipant.displayName}
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-text">
                {conversation.otherParticipant.displayName}
              </p>
              <p className="truncate text-xs text-muted">
                {conversation.lastMessage ?? 'No messages yet'}
              </p>
            </div>
          </div>
          {conversation.lastMessageAt && (
            <p className="shrink-0 text-xs text-muted">{formatRelativeTime(conversation.lastMessageAt)}</p>
          )}
        </Card>
      ))}
    </div>
  )
}
