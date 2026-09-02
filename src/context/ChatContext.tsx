import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { ChatWindow } from '../components/ChatWindow'
import { Toast } from '../components/ui/Toast'
import { GroupFilledCelebration } from '../components/ui/GroupFilledCelebration'
import { getConversations, getOrCreateConversation, type ChatMessage, type Conversation } from '../api/chatApi'
import type { LfgGroup } from '../api/lfgGroupsApi'
import { useAuth } from './AuthContext'
import { useNotificationPreferences } from './NotificationPreferencesContext'
import { connectChatHub, disconnectChatHub, onChatMessage, onInvitationUpdated, onLfgGroupFilled } from '../lib/chatHubConnection'
import { playNotificationSound } from '../lib/sound'
import { showBrowserNotification } from '../lib/browserNotifications'
import { useIsMobile } from '../lib/useIsMobile'

const MAX_OPEN_CHATS = 4
const CHAT_WINDOW_OFFSET_REM = 25 // window width (24rem) + gap (1rem)

interface OpenChat {
  conversation: Conversation
  isMinimized: boolean
}

interface ChatContextValue {
  openChatWithUser: (userId: string) => Promise<void>
  openConversation: (conversation: Conversation) => void
  closeChat: (conversationId: string) => void
  error: string | null
  unreadConversationIds: Set<string>
  hasUnread: boolean
}

const ChatContext = createContext<ChatContextValue | null>(null)

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user, token } = useAuth()
  const activeUserId = user && token ? user.id : null
  const activeUserIdRef = useRef(activeUserId)
  activeUserIdRef.current = activeUserId
  const { preferences } = useNotificationPreferences()
  const [openChats, setOpenChats] = useState<OpenChat[]>([])
  const [error, setError] = useState<string | null>(null)
  const [notificationToast, setNotificationToast] = useState<string | null>(null)
  const [unreadConversationIds, setUnreadConversationIds] = useState<Set<string>>(new Set())
  const [filledGroupCelebration, setFilledGroupCelebration] = useState<LfgGroup | null>(null)
  const isMobile = useIsMobile()

  // On mobile a chat window is fullscreen, so stacking several of them just
  // buries all but the last one under an identical `inset-0` overlay. Render
  // only the most recently opened chat; the rest stay in state (so closing the
  // top one reveals the previous) but unmount, which also stops their polling.
  const visibleChats = useMemo(
    () => (!activeUserId ? [] : isMobile ? openChats.slice(-1) : openChats),
    [activeUserId, isMobile, openChats],
  )

  useEffect(() => {
    setOpenChats([])
    setUnreadConversationIds(new Set())
    setError(null)
    setNotificationToast(null)
    setFilledGroupCelebration(null)
  }, [activeUserId])

  useEffect(() => {
    if (!token) {
      disconnectChatHub()
      return
    }
    connectChatHub(token)
    return () => {
      disconnectChatHub()
    }
  }, [token])

  const showConversation = useCallback((conversation: Conversation) => {
    if (!activeUserId || activeUserIdRef.current !== activeUserId) return
    setOpenChats((prev) => {
      const existingIndex = prev.findIndex((chat) => chat.conversation.id === conversation.id)
      const withoutExisting = existingIndex >= 0 ? prev.filter((chat) => chat.conversation.id !== conversation.id) : prev
      const next = [...withoutExisting, { conversation, isMinimized: false }]
      return next.length > MAX_OPEN_CHATS ? next.slice(next.length - MAX_OPEN_CHATS) : next
    })
    setUnreadConversationIds((prev) => {
      if (!prev.has(conversation.id)) return prev
      const next = new Set(prev)
      next.delete(conversation.id)
      return next
    })
  }, [activeUserId])

  useEffect(() => {
    if (!user) return
    return onLfgGroupFilled((group) => {
      setFilledGroupCelebration(group)
      if (token) {
        getConversations(token)
          .then((conversations) => {
            const match = conversations.find((c) => c.lfgGroupId === group.id)
            if (match) {
              showConversation(match)
            }
          })
          .catch(() => {
            /* the celebration + a manual "Öppna gruppchatten" fallback still work */
          })
      }
    })
  }, [user, token, showConversation])

  useEffect(() => {
    if (!user || !token) return
    return onInvitationUpdated((invitation) => {
      if (invitation.status !== 'Accepted' || invitation.senderUserId !== user.id) return
      getOrCreateConversation(token, invitation.recipientUserId)
        .then(showConversation)
        .catch(() => {
          // The conversation remains available from the messages page after a reload.
        })
    })
  }, [user, token, showConversation])

  useEffect(() => {
    if (!user) return

    return onChatMessage((message: ChatMessage) => {
      if (message.senderUserId === user.id) return

      // Must mirror what is actually rendered, not what is merely in state.
      // On mobile only the last chat is mounted, so a conversation that is
      // "open" but hidden still needs to raise a notification.
      const isConversationActiveOnScreen = visibleChats.some(
        (chat) => chat.conversation.id === message.conversationId && !chat.isMinimized,
      )

      // Pop the chat window open (or un-minimize it) whenever it isn't
      // already visible on screen, so the user never has to hunt for a new
      // message - it always surfaces itself.
      if (!isConversationActiveOnScreen) {
        const senderParticipant = {
          userId: message.senderUserId,
          username: message.senderUsername,
          displayName: message.senderDisplayName,
          avatarUrl: message.senderAvatarUrl,
        }
        // We don't know from the message payload alone whether the
        // underlying conversation is Direct or Group (e.g. a brand new
        // group chat the user hasn't opened yet), so fetch the real
        // conversation list and use the matching entry - this keeps the
        // group's stacked avatars/title correct instead of always
        // rendering as if it were a 1:1 chat with the sender. Falls back
        // to a synthesized Direct conversation only if the lookup fails
        // (e.g. a transient network error).
        if (token) {
          getConversations(token)
            .then((conversations) => {
              const match = conversations.find((c) => c.id === message.conversationId)
              if (match) {
                showConversation(match)
              } else {
                showConversation(
                  {
                    id: message.conversationId,
                    type: 'Direct',
                    title: null,
                    otherParticipant: senderParticipant,
                    lastMessage: message.body,
                    lastMessageAt: message.createdAt,
                    createdAt: message.createdAt,
                    updatedAt: message.createdAt,
                    participants: [senderParticipant],
                    lfgGroupId: null,
                  },
                )
              }
            })
            .catch(() => {
              showConversation(
                {
                  id: message.conversationId,
                  type: 'Direct',
                  title: null,
                  otherParticipant: senderParticipant,
                  lastMessage: message.body,
                  lastMessageAt: message.createdAt,
                  createdAt: message.createdAt,
                  updatedAt: message.createdAt,
                  participants: [senderParticipant],
                  lfgGroupId: null,
                },
              )
            })
        }
      }

      const shouldNotify = document.hidden || !document.hasFocus() || !isConversationActiveOnScreen

      if (!shouldNotify) return

      // The window may have just been opened/un-minimized above (which
      // clears unread state), but if the tab itself is hidden/unfocused the
      // user still hasn't actually seen the message, so keep the unread
      // indicator (e.g. sidebar badge, conversation list) lit until they do.
      setUnreadConversationIds((prev) => {
        if (prev.has(message.conversationId)) return prev
        const next = new Set(prev)
        next.add(message.conversationId)
        return next
      })

      if (preferences.chatSoundEnabled) {
        playNotificationSound()
      }

      if (preferences.chatBrowserNotificationsEnabled) {
        showBrowserNotification(message.senderDisplayName, message.body)
      } else {
        setNotificationToast(`${message.senderDisplayName}: ${message.body}`)
      }
    })
  }, [user, token, visibleChats, preferences, showConversation])

  const openChatWithUser = useCallback(
    async (userId: string) => {
      if (!token) return
      setError(null)
      try {
        const conversation = await getOrCreateConversation(token, userId)
        showConversation(conversation)
      } catch {
        setError('Failed to open chat.')
      }
    },
    [token, showConversation],
  )

  const openConversation = useCallback(
    (conversation: Conversation) => {
      if (!activeUserId) return
      setError(null)
      showConversation(conversation)
    },
    [activeUserId, showConversation],
  )

  const closeChat = useCallback((conversationId: string) => {
    setOpenChats((prev) => prev.filter((chat) => chat.conversation.id !== conversationId))
  }, [])

  const toggleMinimize = useCallback((conversationId: string) => {
    setOpenChats((prev) =>
      prev.map((chat) =>
        chat.conversation.id === conversationId ? { ...chat, isMinimized: !chat.isMinimized } : chat,
      ),
    )
    setUnreadConversationIds((prev) => {
      if (!prev.has(conversationId)) return prev
      const next = new Set(prev)
      next.delete(conversationId)
      return next
    })
  }, [])

  return (
    <ChatContext.Provider
      value={{
        openChatWithUser,
        openConversation,
        closeChat,
        error,
        unreadConversationIds,
        hasUnread: activeUserId != null && unreadConversationIds.size > 0,
      }}
    >
      {children}
      {visibleChats.map((chat, index) => (
        <ChatWindow
          key={chat.conversation.id}
          conversation={chat.conversation}
          isMinimized={chat.isMinimized}
          onToggleMinimize={() => toggleMinimize(chat.conversation.id)}
          onClose={() => closeChat(chat.conversation.id)}
          style={{ right: `calc(1rem + ${index * CHAT_WINDOW_OFFSET_REM}rem)` }}
        />
      ))}
      {notificationToast && (
        <Toast message={notificationToast} onDismiss={() => setNotificationToast(null)} />
      )}
      {filledGroupCelebration && (
        <GroupFilledCelebration
          group={filledGroupCelebration}
          onClose={() => setFilledGroupCelebration(null)}
          onOpenChat={() => setFilledGroupCelebration(null)}
        />
      )}
    </ChatContext.Provider>
  )
}

export function useChat(): ChatContextValue {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider')
  }
  return context
}
