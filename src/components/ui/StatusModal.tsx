import { useState } from 'react'
import { Moon, Circle, EyeOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from './Button'
import { Modal } from './Modal'
import { ApiError } from '../../api/http'
import type { ProfileStatus } from '../../api/profilesApi'
import { useStatus } from '../../context/StatusContext'

interface StatusModalProps {
  onClose: () => void
}

const statusOptions: { value: ProfileStatus; labelKey: string; descriptionKey: string; icon: typeof Circle }[] = [
  { value: 'Online', labelKey: 'statusModal.statusOnline', descriptionKey: 'statusModal.statusOnlineDescription', icon: Circle },
  { value: 'Busy', labelKey: 'statusModal.statusBusy', descriptionKey: 'statusModal.statusBusyDescription', icon: Moon },
  { value: 'Offline', labelKey: 'statusModal.statusOffline', descriptionKey: 'statusModal.statusOfflineDescription', icon: EyeOff },
]

export function StatusModal({ onClose }: StatusModalProps) {
  const { t } = useTranslation('ui')
  const { status, updateStatus } = useStatus()

  const [selectedStatus, setSelectedStatus] = useState<ProfileStatus>(
    status === 'LookingForGame' || status === 'Inactive' ? 'Online' : status,
  )
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    setError(null)
    setIsSaving(true)
    try {
      await updateStatus(selectedStatus, null, null, null)
      onClose()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('statusModal.error'))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Modal title={t('statusModal.title')} onClose={onClose}>
      {status === 'LookingForGame' && (
        <p className="mb-3 rounded-lg border border-border bg-surface-raised p-3 text-xs text-muted">
          {t('statusModal.lookingForGameNotice')}
        </p>
      )}

      <div className="flex flex-col gap-2">
        {statusOptions.map(({ value, labelKey, descriptionKey, icon: Icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => setSelectedStatus(value)}
            className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors cursor-pointer ${
              selectedStatus === value
                ? 'border-primary bg-surface-raised'
                : 'border-border hover:bg-surface-raised'
            }`}
          >
            <Icon className="h-5 w-5 shrink-0 text-muted" aria-hidden="true" />
            <span>
              <span className="block text-sm font-medium text-text">{t(labelKey)}</span>
              <span className="block text-xs text-muted">{t(descriptionKey)}</span>
            </span>
          </button>
        ))}
      </div>

      {error && <p className="mt-3 text-sm text-frustrated">{error}</p>}

      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose} disabled={isSaving}>
          {t('statusModal.cancel')}
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? t('statusModal.saving') : t('statusModal.save')}
        </Button>
      </div>
    </Modal>
  )
}
