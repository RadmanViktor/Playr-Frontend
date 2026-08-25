import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { Avatar } from './ui/Avatar'
import { Button } from './ui/Button'
import { getMessages, sendMessage, type ChatMessage, type Conversation } from '../api/chatApi'
import { useAuth } from '../context/AuthContext'

const MESSAGE_REFRESH_INTERVAL_MS = 2000

interface ChatWindowProps {
  conversation: Conversation
  successMessage?: string | null
  onClose: () => void
}

export function ChatWindow({ conversation, successMessage, onClose }: ChatWindowProps) {
  const { user, token } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [body, setBody] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!token) return
    let cancelled = false
    let hasLoadedOnce = false

    async function loadMessages() {
      if (!token) return
      if (!hasLoadedOnce) {
        setIsLoading(true)
      }
      try {
        const result = await getMessages(token, conversation.id)
        if (!cancelled) {
          setMessages(result)
          setError(null)
          hasLoadedOnce = true
        }
      } catch {
        if (!cancelled) setError('Failed to load messages.')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    setIsLoading(true)
    setError(null)
    loadMessages()
    const intervalId = window.setInterval(loadMessages, MESSAGE_REFRESH_INTERVAL_MS)

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
    }
  }, [conversation.id, token])

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    if (!token) return
    const trimmed = body.trim()
    if (!trimmed) return
    setIsSending(true)
    setError(null)
    try {
      const sent = await sendMessage(token, conversation.id, trimmed)
      setMessages((prev) => [...prev, sent])
      setBody('')
    } catch {
      setError('Failed to send message.')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex h-[28rem] w-96 max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-2xl">
      <div className="flex items-center gap-3 border-b border-border bg-surface-raised px-4 py-3">
        <Avatar
          src={conversation.otherParticipant.avatarUrl ?? undefined}
          alt={conversation.otherParticipant.displayName}
          size="sm"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-text">{conversation.otherParticipant.displayName}</p>
          <p className="truncate text-xs text-muted">@{conversation.otherParticipant.username}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close chat"
          className="rounded-lg p-1 text-muted hover:bg-surface hover:text-text cursor-pointer"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      {successMessage && (
        <div className="border-b border-enjoying/30 bg-enjoying/10 px-4 py-2 text-xs font-medium text-enjoying">
          {successMessage}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {isLoading ? (
          <p className="text-sm text-muted">Loading messages...</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-muted">Say hi and plan your next game together.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {messages.map((message) => {
              const isMine = message.senderUserId === user?.id
              return (
                <div key={message.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                      isMine ? 'bg-primary text-white' : 'bg-surface-raised text-text'
                    }`}
                  >
                    {message.body}
                  </div>
                </div>
              )
            })}
            <div ref={scrollRef} />
          </div>
        )}
      </div>

      {error && <p className="px-4 pb-2 text-xs text-frustrated">{error}</p>}

      <div className="flex gap-2 border-t border-border p-3">
        <input
          value={body}
          onChange={(event) => setBody(event.target.value.slice(0, 1000))}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              handleSend()
            }
          }}
          placeholder="Write a message..."
          className="min-w-0 flex-1 rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-text outline-none placeholder:text-muted focus:border-primary"
        />
        <Button size="sm" onClick={handleSend} disabled={isSending || body.trim().length === 0}>
          Send
        </Button>
      </div>
    </div>
  )
}
