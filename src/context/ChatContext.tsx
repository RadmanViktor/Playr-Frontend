import { createContext, useCallback, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import { ChatWindow } from '../components/ChatWindow'
import { getOrCreateConversation, type Conversation } from '../api/chatApi'
import { useAuth } from './AuthContext'

interface OpenChatOptions {
  successMessage?: string | null
}

interface ChatContextValue {
  openChatWithUser: (userId: string, options?: OpenChatOptions) => Promise<void>
  openConversation: (conversation: Conversation) => void
  closeChat: () => void
  error: string | null
}

const ChatContext = createContext<ChatContextValue | null>(null)

export function ChatProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth()
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const openChatWithUser = useCallback(
    async (userId: string, options?: OpenChatOptions) => {
      if (!token) return
      setError(null)
      try {
        const conversation = await getOrCreateConversation(token, userId)
        setSuccessMessage(options?.successMessage ?? null)
        setActiveConversation(conversation)
      } catch {
        setError('Failed to open chat.')
      }
    },
    [token],
  )

  const openConversation = useCallback((conversation: Conversation) => {
    setError(null)
    setSuccessMessage(null)
    setActiveConversation(conversation)
  }, [])

  const closeChat = useCallback(() => {
    setActiveConversation(null)
    setSuccessMessage(null)
  }, [])

  return (
    <ChatContext.Provider value={{ openChatWithUser, openConversation, closeChat, error }}>
      {children}
      {activeConversation && (
        <ChatWindow conversation={activeConversation} successMessage={successMessage} onClose={closeChat} />
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
