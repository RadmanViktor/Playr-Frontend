import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from './Button'
import { Modal } from './Modal'
import { Avatar } from './Avatar'
import { useAuth } from '../../context/AuthContext'
import { applyToLfgGroup } from '../../api/lfgGroupsApi'
import { ApiError } from '../../api/http'

const MAX_MESSAGE_LENGTH = 500

interface LfgGroupApplyModalProps {
  lfgGroupId: string
  creatorDisplayName: string
  creatorAvatarUrl?: string | null
  gameName: string
  onClose: () => void
  onSent: () => void
}

export function LfgGroupApplyModal({
  lfgGroupId,
  creatorDisplayName,
  creatorAvatarUrl,
  gameName,
  onClose,
  onSent,
}: LfgGroupApplyModalProps) {
  const { t } = useTranslation('ui')
  const { token } = useAuth()
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSend() {
    setError(null)
    if (!token) {
      setError(t('lfgGroupApplyModal.errorNotLoggedIn'))
      return
    }

    setIsSending(true)
    try {
      await applyToLfgGroup(token, lfgGroupId, message.trim() || null)
      onSent()
      onClose()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('lfgGroupApplyModal.errorGeneric'))
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Modal title={t('lfgGroupApplyModal.title')} onClose={onClose}>
      <div className="mb-4 flex items-center gap-3">
        <Avatar src={creatorAvatarUrl ?? undefined} alt={creatorDisplayName} size="md" />
        <p className="text-sm text-text">
          {t('lfgGroupApplyModal.promptText')} <span className="font-medium">{creatorDisplayName}</span>
          {t('lfgGroupApplyModal.promptSuffix', { gameName })}
        </p>
      </div>

      <label htmlFor="lfg-apply-message" className="mb-1 block text-xs font-medium text-muted">
        {t('lfgGroupApplyModal.messageLabel')}
      </label>
      <textarea
        id="lfg-apply-message"
        value={message}
        onChange={(event) => setMessage(event.target.value.slice(0, MAX_MESSAGE_LENGTH))}
        placeholder={t('lfgGroupApplyModal.placeholderText')}
        rows={4}
        className="w-full resize-none rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-text outline-none placeholder:text-muted focus:border-primary"
      />
      <p className="mt-1 text-right text-xs text-muted">
        {message.length}/{MAX_MESSAGE_LENGTH}
      </p>

      {error && <p className="mt-2 text-sm text-frustrated">{error}</p>}

      <div className="mt-4 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose} disabled={isSending}>
          {t('lfgGroupApplyModal.cancel')}
        </Button>
        <Button onClick={handleSend} disabled={isSending}>
          {isSending ? t('lfgGroupApplyModal.sending') : t('lfgGroupApplyModal.actionLabel')}
        </Button>
      </div>
    </Modal>
  )
}
