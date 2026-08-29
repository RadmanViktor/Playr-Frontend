import { useState } from 'react'
import { Moon, Circle, EyeOff } from 'lucide-react'
import { Button } from './Button'
import { Modal } from './Modal'
import type { ProfileStatus } from '../../api/profilesApi'
import { useStatus } from '../../context/StatusContext'

interface StatusModalProps {
  onClose: () => void
}

const statusOptions: { value: ProfileStatus; label: string; description: string; icon: typeof Circle }[] = [
  { value: 'Online', label: 'Online', description: 'Visible and available', icon: Circle },
  { value: 'Busy', label: 'Busy', description: "Online, but don't disturb", icon: Moon },
  { value: 'Offline', label: 'Offline', description: 'Appear offline to others', icon: EyeOff },
]

export function StatusModal({ onClose }: StatusModalProps) {
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
    } catch {
      setError('Failed to update status. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Modal title="Set your status" onClose={onClose}>
      {status === 'LookingForGame' && (
        <p className="mb-3 rounded-lg border border-border bg-surface-raised p-3 text-xs text-muted">
          You're looking for a game. Manage that on Find Players.
        </p>
      )}

      <div className="flex flex-col gap-2">
        {statusOptions.map(({ value, label, description, icon: Icon }) => (
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
              <span className="block text-sm font-medium text-text">{label}</span>
              <span className="block text-xs text-muted">{description}</span>
            </span>
          </button>
        ))}
      </div>

      {error && <p className="mt-3 text-sm text-frustrated">{error}</p>}

      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </Modal>
  )
}
