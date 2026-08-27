import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { ChatWindow } from '../components/ChatWindow'
import { Toast } from '../components/ui/Toast'
import { getOrCreateConversation, type ChatMessage, type Conversation } from '../api/chatApi'
import { useAuth } from './AuthContext'
import { useNotificationPreferences } from './NotificationPreferencesContext'
import { connectChatHub, disconnectChatHub, onChatMessage } from '../lib/chatHubConnection'
import { playNotificationSound } from '../lib/sound'
import { showBrowserNotification } from '../lib/browserNotifications'

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

  useEffect(() => {
    if (!user) return

    return onChatMessage((message: ChatMessage) => {
      if (message.senderUserId === user.id) return

      const isConversationActiveOnScreen = openChats.some(
        (chat) => chat.conversation.id === message.conversationId && !chat.isMinimized,
      )
      const shouldNotify = document.hidden || !document.hasFocus() || !isConversationActiveOnScreen

      if (!shouldNotify) return

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
  }, [user, openChats, preferences])

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
      {openChats.map((chat, index) => (
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
