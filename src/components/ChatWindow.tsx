import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { ChevronDown, ChevronUp, Paperclip, X } from 'lucide-react'
import { Avatar, type AvatarStatus } from './ui/Avatar'
import { Button } from './ui/Button'
import { EmojiPickerButton } from './EmojiPickerButton'
import { isVideoFile, validateMediaFile } from './MediaUploadInput'
import { getMessages, sendMessage, type ChatMessage, type Conversation } from '../api/chatApi'
import { resolveMediaUrl } from '../api/http'
import { getProfile, type ProfileStatus } from '../api/profilesApi'
import { useAuth } from '../context/AuthContext'
import { linkifyChatMessage } from '../lib/linkify'
import { useIsMobile } from '../lib/useIsMobile'
import { useVisualViewportHeight } from '../lib/useVisualViewportHeight'

const statusAvatarMap: Record<ProfileStatus, AvatarStatus> = {
  Online: 'online',
  LookingForGame: 'looking-for-game',
  Busy: 'busy',
  Inactive: 'inactive',
  Offline: 'offline',
}

const MESSAGE_REFRESH_INTERVAL_MS = 2000

function formatMessageTime(isoDate: string): string {
  const date = new Date(isoDate)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()
  const time = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  if (isToday) return time
  const dateLabel = date.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' })
  return `${dateLabel} ${time}`
}

interface ChatWindowProps {
  conversation: Conversation
  successMessage?: string | null
  isMinimized: boolean
  onToggleMinimize: () => void
  onClose: () => void
  style?: CSSProperties
}

export function ChatWindow({
  conversation,
  successMessage,
  isMinimized,
  onToggleMinimize,
  onClose,
  style,
}: ChatWindowProps) {
  const { user, token } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [body, setBody] = useState('')
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [otherStatus, setOtherStatus] = useState<ProfileStatus | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const chatUsernames = [conversation.otherParticipant.username, user?.username].filter(
    (username): username is string => Boolean(username),
  )

  const isMobile = useIsMobile()
  // Only relevant for the fullscreen mobile layout; the docked desktop window
  // has a fixed height and sits above the keyboard anyway.
  const isFullscreen = isMobile && !isMinimized
  const viewport = useVisualViewportHeight(isFullscreen)

  // iOS Safari keeps the layout viewport at full height when the keyboard
  // opens, so `h-dvh` alone would leave the composer underneath it. Pin the
  // window to the visual viewport instead when we can measure it.
  const viewportStyle: CSSProperties =
    isFullscreen && viewport
      ? { top: viewport.offsetTop, height: viewport.height, bottom: 'auto' }
      : {}

  useEffect(() => {
    let cancelled = false
    setOtherStatus(null)
    getProfile(conversation.otherParticipant.username)
      .then((profile) => {
        if (!cancelled) setOtherStatus(profile.status)
      })
      .catch(() => {
        if (!cancelled) setOtherStatus(null)
      })
    return () => {
      cancelled = true
    }
  }, [conversation.otherParticipant.username])

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

  useEffect(() => {
    if (!mediaFile) {
      setMediaPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(mediaFile)
    setMediaPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [mediaFile])

  function handleFileSelected(selected: File | null) {
    if (!selected) {
      setMediaFile(null)
      return
    }
    const validationError = validateMediaFile(selected)
    if (validationError) {
      setError(validationError)
      setMediaFile(null)
      return
    }
    setError(null)
    setMediaFile(selected)
  }

  function clearMediaFile() {
    setMediaFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleSend() {
    if (!token) return
    const trimmed = body.trim()
    if (!trimmed && !mediaFile) return
    setIsSending(true)
    setError(null)
    try {
      const sent = await sendMessage(token, conversation.id, trimmed, mediaFile)
      setMessages((prev) => [...prev, sent])
      setBody('')
      clearMediaFile()
    } catch {
      setError('Failed to send message.')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div
      style={{ '--chat-right': style?.right ?? '1rem', ...viewportStyle } as CSSProperties}
      className={`fixed inset-0 z-50 flex flex-col border border-border bg-surface shadow-2xl transition-all sm:inset-auto sm:bottom-4 sm:right-[var(--chat-right)] sm:w-96 sm:max-w-[calc(100vw-2rem)] sm:rounded-xl ${
        isMinimized
          ? 'max-sm:inset-auto max-sm:bottom-4 max-sm:left-4 max-sm:right-4 max-sm:rounded-xl h-auto'
          : 'h-dvh sm:h-[28rem]'
      }`}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={onToggleMinimize}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            onToggleMinimize()
          }
        }}
        aria-expanded={!isMinimized}
        className={`flex cursor-pointer items-center gap-3 rounded-t-xl border-b border-border bg-surface-raised px-4 py-3 ${
          isFullscreen ? 'pt-[max(0.75rem,env(safe-area-inset-top))]' : ''
        }`}
      >
        <Avatar
          src={conversation.otherParticipant.avatarUrl ?? undefined}
          alt={conversation.otherParticipant.displayName}
          size="sm"
          status={otherStatus ? statusAvatarMap[otherStatus] : undefined}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-text">{conversation.otherParticipant.displayName}</p>
          <p className="truncate text-xs text-muted">@{conversation.otherParticipant.username}</p>
        </div>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onToggleMinimize()
          }}
          aria-label={isMinimized ? 'Expand chat' : 'Minimize chat'}
          className="rounded-lg p-1 text-muted hover:bg-surface hover:text-text cursor-pointer"
        >
          {isMinimized ? (
            <ChevronUp className="h-5 w-5" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onClose()
          }}
          aria-label="Close chat"
          className="rounded-lg p-1 text-muted hover:bg-surface hover:text-text cursor-pointer"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      {!isMinimized && (
        <>
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
                        {message.mediaUrl && (
                          <div className="mb-1">
                            {message.mediaType === 'Video' ? (
                              <video
                                src={resolveMediaUrl(message.mediaUrl)!}
                                controls
                                className="max-h-64 max-w-full rounded-lg"
                              />
                            ) : (
                              <img
                                src={resolveMediaUrl(message.mediaUrl)!}
                                alt="Attached media"
                                className="max-h-64 max-w-full rounded-lg"
                              />
                            )}
                          </div>
                        )}
                        {message.body && <p>{linkifyChatMessage(message.body, chatUsernames, isMine)}</p>}
                        <p className={`mt-1 text-[10px] ${isMine ? 'text-white/70' : 'text-muted'}`}>
                          {formatMessageTime(message.createdAt)}
                        </p>
                      </div>
                    </div>
                  )
                })}
                <div ref={scrollRef} />
              </div>
            )}
          </div>

          {error && <p className="px-4 pb-2 text-xs text-frustrated">{error}</p>}

          {mediaFile && mediaPreviewUrl && (
            <div className="px-4 pb-2">
              <div className="relative w-fit">
                {isVideoFile(mediaFile) ? (
                  <video src={mediaPreviewUrl} controls className="max-h-32 rounded-lg" />
                ) : (
                  <img src={mediaPreviewUrl} alt="Selected media preview" className="max-h-32 rounded-lg" />
                )}
                <button
                  type="button"
                  aria-label="Remove selected file"
                  onClick={clearMediaFile}
                  className="absolute -right-2 -top-2 rounded-full bg-surface p-1 text-text shadow cursor-pointer"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 border-t border-border p-3 max-sm:pb-[max(0.75rem,env(safe-area-inset-bottom))] overflow-visible rounded-b-xl">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              aria-label="Attach photo or video"
              className="hidden"
              onChange={(event) => handleFileSelected(event.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Attach photo or video"
              className="rounded-lg p-2 text-muted hover:bg-surface-raised hover:text-text cursor-pointer"
            >
              <Paperclip className="h-5 w-5" aria-hidden="true" />
            </button>
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
            <EmojiPickerButton onSelect={(emoji) => setBody((prev) => (prev + emoji).slice(0, 1000))} />
            <Button size="sm" onClick={handleSend} disabled={isSending || (body.trim().length === 0 && !mediaFile)}>
              Send
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
