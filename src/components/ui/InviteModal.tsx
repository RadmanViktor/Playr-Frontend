import { useState } from 'react'
import { useTranslation } from 'react-i18next'
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
  title,
  promptText,
  promptSuffix,
  placeholderText,
  actionLabel,
}: InviteModalProps) {
  const { t } = useTranslation('ui')
  const { token } = useAuth()
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resolvedTitle = title ?? t('inviteModal.title')
  const resolvedPromptText = promptText ?? t('inviteModal.promptText')
  const resolvedPromptSuffix = promptSuffix ?? t('inviteModal.promptSuffix')
  const resolvedPlaceholderText = placeholderText ?? t('inviteModal.placeholderText')
  const resolvedActionLabel = actionLabel ?? t('inviteModal.actionLabel')

  async function handleSend() {
    setError(null)
    const trimmed = message.trim()
    if (trimmed.length === 0) {
      setError(t('inviteModal.errorEmptyMessage'))
      return
    }

    if (!token) {
      setError(t('inviteModal.errorNotLoggedIn'))
      return
    }

    setIsSending(true)
    try {
      await sendInvitation(token, recipientUserId, trimmed)
      onSent()
      onClose()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('inviteModal.errorGeneric'))
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Modal title={resolvedTitle} onClose={onClose}>
        <div className="mb-4 flex items-center gap-3">
          <Avatar src={recipientAvatarUrl ?? undefined} alt={recipientDisplayName} size="md" />
          <p className="text-sm text-text">
            {resolvedPromptText} <span className="font-medium">{recipientDisplayName}</span>{resolvedPromptSuffix}
          </p>
        </div>

        <label htmlFor="invite-message" className="mb-1 block text-xs font-medium text-muted">
          {t('inviteModal.presentationLabel')}
        </label>
        <textarea
          id="invite-message"
          value={message}
          onChange={(event) => setMessage(event.target.value.slice(0, MAX_MESSAGE_LENGTH))}
          placeholder={resolvedPlaceholderText}
          rows={4}
          className="w-full resize-none rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-text outline-none placeholder:text-muted focus:border-primary"
        />
        <p className="mt-1 text-right text-xs text-muted">
          {message.length}/{MAX_MESSAGE_LENGTH}
        </p>

        {error && <p className="mt-2 text-sm text-frustrated">{error}</p>}

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={isSending}>
            {t('inviteModal.cancel')}
          </Button>
          <Button onClick={handleSend} disabled={isSending}>
            {isSending ? t('inviteModal.sending') : resolvedActionLabel}
          </Button>
        </div>
    </Modal>
  )
}
