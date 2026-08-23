import { useEffect, useState } from 'react'
import { Gamepad2, Moon, Circle, EyeOff, X } from 'lucide-react'
import { Button } from './Button'
import { getGames, type Game } from '../../api/gamesApi'
import type { PlayStyle, ProfileStatus } from '../../api/profilesApi'
import { useStatus } from '../../context/StatusContext'

interface StatusModalProps {
  onClose: () => void
}

const statusOptions: { value: ProfileStatus; label: string; description: string; icon: typeof Circle }[] = [
  { value: 'Online', label: 'Online', description: 'Visible and available', icon: Circle },
  { value: 'LookingForGame', label: 'Looking for game', description: 'Show others you want to play', icon: Gamepad2 },
  { value: 'Busy', label: 'Busy', description: "Online, but don't disturb", icon: Moon },
  { value: 'Offline', label: 'Offline', description: 'Appear offline to others', icon: EyeOff },
]

const playStyleOptions: { value: PlayStyle; label: string; description: string }[] = [
  { value: 'Competitive', label: 'Competitive', description: 'Ranked, sweaty, trying to win' },
  { value: 'Chill', label: 'Chill', description: 'Casual, relaxed, just for fun' },
]

export function StatusModal({ onClose }: StatusModalProps) {
  const { status, lookingForGameId, lookingForPlayStyle, updateStatus } = useStatus()

  const [selectedStatus, setSelectedStatus] = useState<ProfileStatus>(status)
  const [selectedGameId, setSelectedGameId] = useState<string | null>(lookingForGameId)
  const [selectedPlayStyle, setSelectedPlayStyle] = useState<PlayStyle | null>(lookingForPlayStyle)
  const [games, setGames] = useState<Game[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getGames()
      .then((result) => {
        if (!cancelled) setGames(result)
      })
      .catch(() => {
        if (!cancelled) setGames([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  const needsGameSelection = selectedStatus === 'LookingForGame'

  async function handleSave() {
    setError(null)

    if (needsGameSelection && (!selectedGameId || !selectedPlayStyle)) {
      setError('Choose a game and a play style.')
      return
    }

    setIsSaving(true)
    try {
      await updateStatus(
        selectedStatus,
        needsGameSelection ? selectedGameId : null,
        needsGameSelection ? selectedPlayStyle : null,
      )
      onClose()
    } catch {
      setError('Failed to update status. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 cursor-pointer"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-border bg-surface p-5 cursor-default"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text">Set your status</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1 text-muted hover:bg-surface-raised hover:text-text cursor-pointer"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

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

        {needsGameSelection && (
          <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
            <div>
              <label htmlFor="status-game" className="mb-1 block text-xs font-medium text-muted">
                Game
              </label>
              <select
                id="status-game"
                value={selectedGameId ?? ''}
                onChange={(event) => setSelectedGameId(event.target.value || null)}
                className="w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-text cursor-pointer"
              >
                <option value="" disabled>
                  Select a game
                </option>
                {games.map((game) => (
                  <option key={game.id} value={game.id}>
                    {game.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="mb-1 block text-xs font-medium text-muted">Play style</span>
              <div className="flex gap-2">
                {playStyleOptions.map(({ value, label, description }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSelectedPlayStyle(value)}
                    title={description}
                    className={`flex-1 rounded-lg border p-2 text-center text-sm font-medium transition-colors cursor-pointer ${
                      selectedPlayStyle === value
                        ? 'border-primary bg-surface-raised text-text'
                        : 'border-border text-muted hover:bg-surface-raised'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {error && <p className="mt-3 text-sm text-frustrated">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  )
}
