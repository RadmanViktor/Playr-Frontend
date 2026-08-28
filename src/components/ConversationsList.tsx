import { useEffect, useState } from 'react'
import { Card } from './ui/Card'
import { Avatar, type AvatarStatus } from './ui/Avatar'
import { getConversations, type Conversation } from '../api/chatApi'
import { getProfile, type ProfileStatus } from '../api/profilesApi'
import { useAuth } from '../context/AuthContext'
import { useChat } from '../context/ChatContext'

const statusAvatarMap: Record<ProfileStatus, AvatarStatus> = {
  Online: 'online',
  LookingForGame: 'looking-for-game',
  Busy: 'busy',
  Offline: 'offline',
}

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
  const { openConversation, error: chatError, unreadConversationIds } = useChat()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusByUsername, setStatusByUsername] = useState<Record<string, ProfileStatus>>({})

  useEffect(() => {
    if (!token) return
    setIsLoading(true)
    setError(null)
    getConversations(token)
      .then(setConversations)
      .catch(() => setError('Failed to load chats.'))
      .finally(() => setIsLoading(false))
  }, [token])

  useEffect(() => {
    if (conversations.length === 0) return
    let cancelled = false
    Promise.all(
      conversations.map((conversation) =>
        getProfile(conversation.otherParticipant.username)
          .then((profile) => [conversation.otherParticipant.username, profile.status] as const)
          .catch(() => null),
      ),
    ).then((results) => {
      if (cancelled) return
      setStatusByUsername((prev) => {
        const next = { ...prev }
        for (const result of results) {
          if (result) next[result[0]] = result[1]
        }
        return next
      })
    })
    return () => {
      cancelled = true
    }
  }, [conversations])

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

      {conversations.map((conversation) => {
        const isUnread = unreadConversationIds.has(conversation.id)
        return (
          <Card
            key={conversation.id}
            className="flex flex-wrap cursor-pointer items-center justify-between gap-4"
            onClick={() => openConversation(conversation)}
          >
            <div className="flex min-w-0 items-center gap-3">
              <Avatar
                src={conversation.otherParticipant.avatarUrl ?? undefined}
                alt={conversation.otherParticipant.displayName}
                status={statusByUsername[conversation.otherParticipant.username]
                  ? statusAvatarMap[statusByUsername[conversation.otherParticipant.username]]
                  : undefined}
              />
              <div className="min-w-0">
                <p className={`truncate text-sm ${isUnread ? 'font-semibold text-text' : 'font-medium text-text'}`}>
                  {conversation.otherParticipant.displayName}
                </p>
                <p className={`truncate text-xs ${isUnread ? 'font-medium text-text' : 'text-muted'}`}>
                  {conversation.lastMessage ?? 'No messages yet'}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {conversation.lastMessageAt && (
                <p className="text-xs text-muted">{formatRelativeTime(conversation.lastMessageAt)}</p>
              )}
              {isUnread && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-primary" aria-label="Unread" />}
            </div>
          </Card>
        )
      })}
    </div>
  )
}
