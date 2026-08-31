import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from './ui/Card'
import { Avatar, type AvatarStatus } from './ui/Avatar'
import { AvatarStack } from './ui/AvatarStack'
import { getConversations, getOtherParticipants, type Conversation } from '../api/chatApi'
import { getProfile, type ProfileStatus } from '../api/profilesApi'
import { useAuth } from '../context/AuthContext'
import { useChat } from '../context/ChatContext'
import { onUserStatusChanged } from '../lib/chatHubConnection'

const statusAvatarMap: Record<ProfileStatus, AvatarStatus> = {
  Online: 'online',
  LookingForGame: 'looking-for-game',
  Busy: 'busy',
  Inactive: 'inactive',
  Offline: 'offline',
}

function formatRelativeTime(dateString: string, t: (key: string, opts?: Record<string, unknown>) => string): string {
  const diffMs = Date.now() - new Date(dateString).getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  if (diffMin < 60) return t('conversationsList.minutesAgo', { count: Math.max(diffMin, 1) })
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return t('conversationsList.hoursAgo', { count: diffH })
  return t('conversationsList.daysAgo', { count: Math.floor(diffH / 24) })
}

export function ConversationsList() {
  const { t } = useTranslation('componentsB')
  const { token, user } = useAuth()
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
      .catch(() => setError(t('conversationsList.loadError')))
      .finally(() => setIsLoading(false))
  }, [token])

  useEffect(() => {
    if (conversations.length === 0) return
    let cancelled = false
    Promise.all(
      conversations
        .filter((conversation) => conversation.type !== 'Group' && conversation.otherParticipant)
        .map((conversation) =>
          getProfile(conversation.otherParticipant!.username)
            .then((profile) => [conversation.otherParticipant!.username, profile.status] as const)
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

  useEffect(() => {
    return onUserStatusChanged((event) => {
      const conversation = conversations.find((c) => c.otherParticipant?.userId === event.userId)
      if (!conversation || !conversation.otherParticipant) return
      setStatusByUsername((prev) => ({ ...prev, [conversation.otherParticipant!.username]: event.status }))
    })
  }, [conversations])

  if (isLoading) return <p className="text-muted">{t('conversationsList.loading')}</p>
  if (error) return <p className="text-frustrated">{error}</p>

  return (
    <div className="flex flex-col gap-4">
      {chatError && <p className="text-sm text-frustrated">{chatError}</p>}
      {conversations.length === 0 && (
        <Card>
          <p className="text-muted">{t('conversationsList.emptyState')}</p>
        </Card>
      )}

      {conversations.map((conversation) => {
        const isUnread = unreadConversationIds.has(conversation.id)
        const isGroup = conversation.type === 'Group'
        const otherParticipants = getOtherParticipants(conversation, user?.id)
        const displayName = isGroup
          ? conversation.title ?? (otherParticipants.map((p) => p.displayName).join(', ') || t('chatWindow.groupChatDefaultTitle'))
          : conversation.otherParticipant?.displayName ?? otherParticipants[0]?.displayName ?? ''
        return (
          <Card
            key={conversation.id}
            className="flex flex-wrap cursor-pointer items-center justify-between gap-4"
            onClick={() => openConversation(conversation)}
          >
            <div className="flex min-w-0 items-center gap-3">
              {isGroup ? (
                <AvatarStack participants={otherParticipants} size="md" />
              ) : (
                <Avatar
                  src={conversation.otherParticipant?.avatarUrl ?? undefined}
                  alt={displayName}
                  status={
                    conversation.otherParticipant && statusByUsername[conversation.otherParticipant.username]
                      ? statusAvatarMap[statusByUsername[conversation.otherParticipant.username]]
                      : undefined
                  }
                />
              )}
              <div className="min-w-0">
                <p className={`truncate text-sm ${isUnread ? 'font-semibold text-text' : 'font-medium text-text'}`}>
                  {displayName}
                </p>
                <p className={`truncate text-xs ${isUnread ? 'font-medium text-text' : 'text-muted'}`}>
                  {conversation.lastMessage ?? t('conversationsList.noMessagesYet')}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {conversation.lastMessageAt && (
                <p className="text-xs text-muted">{formatRelativeTime(conversation.lastMessageAt, t)}</p>
              )}
              {isUnread && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-primary" aria-label={t('conversationsList.unreadAriaLabel')} />}
            </div>
          </Card>
        )
      })}
    </div>
  )
}
