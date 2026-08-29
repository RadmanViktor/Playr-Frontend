import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { ChatWindow } from '../components/ChatWindow'
import { Toast } from '../components/ui/Toast'
import { getOrCreateConversation, type ChatMessage, type Conversation } from '../api/chatApi'
import { useAuth } from './AuthContext'
import { useNotificationPreferences } from './NotificationPreferencesContext'
import { connectChatHub, disconnectChatHub, onChatMessage } from '../lib/chatHubConnection'
import { playNotificationSound } from '../lib/sound'
import { showBrowserNotification } from '../lib/browserNotifications'
import { useIsMobile } from '../lib/useIsMobile'

const MAX_OPEN_CHATS = 4
const CHAT_WINDOW_OFFSET_REM = 25 // window width (24rem) + gap (1rem)

interface OpenChatOptions {
  successMessage?: string | null
}

interface OpenChat {
  conversation: Conversation
  successMessage: string | null
  isMinimized: boolean
}

interface ChatContextValue {
  openChatWithUser: (userId: string, options?: OpenChatOptions) => Promise<void>
  openConversation: (conversation: Conversation) => void
  closeChat: (conversationId: string) => void
  error: string | null
  unreadConversationIds: Set<string>
  hasUnread: boolean
}

const ChatContext = createContext<ChatContextValue | null>(null)

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user, token } = useAuth()
  const { preferences } = useNotificationPreferences()
  const [openChats, setOpenChats] = useState<OpenChat[]>([])
  const [error, setError] = useState<string | null>(null)
  const [notificationToast, setNotificationToast] = useState<string | null>(null)
  const [unreadConversationIds, setUnreadConversationIds] = useState<Set<string>>(new Set())
  const isMobile = useIsMobile()

  // On mobile a chat window is fullscreen, so stacking several of them just
  // buries all but the last one under an identical `inset-0` overlay. Render
  // only the most recently opened chat; the rest stay in state (so closing the
  // top one reveals the previous) but unmount, which also stops their polling.
  const visibleChats = useMemo(
    () => (isMobile ? openChats.slice(-1) : openChats),
    [isMobile, openChats],
  )

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

  const showConversation = useCallback((conversation: Conversation, successMessage: string | null) => {
    setOpenChats((prev) => {
      const existingIndex = prev.findIndex((chat) => chat.conversation.id === conversation.id)
      const withoutExisting = existingIndex >= 0 ? prev.filter((chat) => chat.conversation.id !== conversation.id) : prev
      const next = [...withoutExisting, { conversation, successMessage, isMinimized: false }]
      return next.length > MAX_OPEN_CHATS ? next.slice(next.length - MAX_OPEN_CHATS) : next
    })
    setUnreadConversationIds((prev) => {
      if (!prev.has(conversation.id)) return prev
      const next = new Set(prev)
      next.delete(conversation.id)
      return next
    })
  }, [])

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
        const conversation: Conversation = {
          id: message.conversationId,
          otherParticipant: {
            userId: message.senderUserId,
            username: message.senderUsername,
            displayName: message.senderDisplayName,
            avatarUrl: message.senderAvatarUrl,
          },
          lastMessage: message.body,
          lastMessageAt: message.createdAt,
          createdAt: message.createdAt,
          updatedAt: message.createdAt,
        }
        showConversation(conversation, null)
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
  }, [user, visibleChats, preferences, showConversation])

  const openChatWithUser = useCallback(
    async (userId: string, options?: OpenChatOptions) => {
      if (!token) return
      setError(null)
      try {
        const conversation = await getOrCreateConversation(token, userId)
        showConversation(conversation, options?.successMessage ?? null)
      } catch {
        setError('Failed to open chat.')
      }
    },
    [token, showConversation],
  )

  const openConversation = useCallback(
    (conversation: Conversation) => {
      setError(null)
      showConversation(conversation, null)
    },
    [showConversation],
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
        hasUnread: unreadConversationIds.size > 0,
      }}
    >
      {children}
      {visibleChats.map((chat, index) => (
        <ChatWindow
          key={chat.conversation.id}
          conversation={chat.conversation}
          successMessage={chat.successMessage}
          isMinimized={chat.isMinimized}
          onToggleMinimize={() => toggleMinimize(chat.conversation.id)}
          onClose={() => closeChat(chat.conversation.id)}
          style={{ right: `calc(1rem + ${index * CHAT_WINDOW_OFFSET_REM}rem)` }}
        />
      ))}
      {notificationToast && (
        <Toast message={notificationToast} onDismiss={() => setNotificationToast(null)} />
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
