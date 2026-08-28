import { useState } from 'react'
import { Button } from './Button'
import { Modal } from './Modal'
import { Avatar } from './Avatar'
import { useAuth } from '../../context/AuthContext'
import { sendInvitation } from '../../api/invitationsApi'
import { ApiError } from '../../api/http'

const MAX_MESSAGE_LENGTH = 500

interface InviteModalProps {
  recipientUserId: string
  recipientDisplayName: string
  recipientAvatarUrl?: string | null
  onClose: () => void
  onSent: () => void
  title?: string
  promptText?: string
  promptSuffix?: string
  placeholderText?: string
  actionLabel?: string
}

export function InviteModal({
  recipientUserId,
  recipientDisplayName,
  recipientAvatarUrl,
  onClose,
  onSent,
  title = 'Send invitation',
  promptText = 'Invite',
  promptSuffix = ' to play',
  placeholderText = "Say hi and tell them why you'd like to play together...",
  actionLabel = 'Send invitation',
}: InviteModalProps) {
  const { token } = useAuth()
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSend() {
    setError(null)
    const trimmed = message.trim()
    if (trimmed.length === 0) {
      setError('Write a short presentation of yourself.')
      return
    }

    if (!token) {
      setError('You must be logged in to send invitations.')
      return
    }

    setIsSending(true)
    try {
      await sendInvitation(token, recipientUserId, trimmed)
      onSent()
      onClose()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to send invitation. Please try again.')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Modal title={title} onClose={onClose}>
        <div className="mb-4 flex items-center gap-3">
          <Avatar src={recipientAvatarUrl ?? undefined} alt={recipientDisplayName} size="md" />
          <p className="text-sm text-text">
            {promptText} <span className="font-medium">{recipientDisplayName}</span>{promptSuffix}
          </p>
        </div>

        <label htmlFor="invite-message" className="mb-1 block text-xs font-medium text-muted">
          Presentation
        </label>
        <textarea
          id="invite-message"
          value={message}
          onChange={(event) => setMessage(event.target.value.slice(0, MAX_MESSAGE_LENGTH))}
          placeholder={placeholderText}
          rows={4}
          className="w-full resize-none rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-text outline-none placeholder:text-muted focus:border-primary"
        />
        <p className="mt-1 text-right text-xs text-muted">
          {message.length}/{MAX_MESSAGE_LENGTH}
        </p>

        {error && <p className="mt-2 text-sm text-frustrated">{error}</p>}

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={isSending}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={isSending}>
            {isSending ? 'Sending...' : actionLabel}
          </Button>
        </div>
    </Modal>
  )
}
