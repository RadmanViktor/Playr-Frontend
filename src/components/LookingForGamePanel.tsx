import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from './ui/Card'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'
import { GamePickerInput } from './GamePickerInput'
import { getGames, type Game } from '../api/gamesApi'
import type { PlayStyle } from '../api/profilesApi'
import { useStatus } from '../context/StatusContext'

interface LookingForGamePanelProps {
  onChanged: () => void
}

const playStyleOptions: { value: PlayStyle; labelKey: string; descriptionKey: string }[] = [
  { value: 'Competitive', labelKey: 'lookingForGamePanel.playStyleCompetitive', descriptionKey: 'lookingForGamePanel.playStyleCompetitiveDescription' },
  { value: 'Chill', labelKey: 'lookingForGamePanel.playStyleChill', descriptionKey: 'lookingForGamePanel.playStyleChillDescription' },
]

const MAX_NOTE_LENGTH = 200

export function LookingForGamePanel({ onChanged }: LookingForGamePanelProps) {
  const { t } = useTranslation('componentsB')
  const {
    status,
    lookingForGameName,
    lookingForPlayStyle,
    lookingForGameNote,
    updateStatus,
  } = useStatus()

  const [games, setGames] = useState<Game[]>([])
  const [gamesError, setGamesError] = useState<string | null>(null)
  const [gamesLoadKey, setGamesLoadKey] = useState(0)
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null)
  const [selectedPlayStyle, setSelectedPlayStyle] = useState<PlayStyle | null>(null)
  const [note, setNote] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    let cancelled = false
    setGamesError(null)
    getGames()
      .then((result) => {
        if (!cancelled) setGames(result)
      })
      .catch(() => {
        if (!cancelled) setGamesError(t('lookingForGamePanel.loadGamesError'))
      })
    return () => {
      cancelled = true
    }
  }, [gamesLoadKey])

  const isActive = status === 'LookingForGame'

  async function handleStart() {
    setError(null)
    if (!selectedGameId || !selectedPlayStyle) {
      setError(t('lookingForGamePanel.chooseGameAndStyle'))
      return
    }

    setIsSaving(true)
    try {
      await updateStatus('LookingForGame', selectedGameId, selectedPlayStyle, note.trim() || null)
      setSelectedGameId(null)
      setSelectedPlayStyle(null)
      setNote('')
      setIsExpanded(false)
      onChanged()
    } catch {
      setError(t('lookingForGamePanel.startError'))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleStop() {
    setError(null)
    setIsSaving(true)
    try {
      await updateStatus('Online', null, null, null)
      onChanged()
    } catch {
      setError(t('lookingForGamePanel.stopError'))
    } finally {
      setIsSaving(false)
    }
  }

  if (isActive) {
    return (
      <Card className="flex flex-col gap-3">
        <div>
          <p className="text-sm font-semibold text-text">{t('lookingForGamePanel.availableTitle')}</p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {lookingForGameName && <Badge variant="tag">{lookingForGameName}</Badge>}
            {lookingForPlayStyle && (
              <Badge variant={lookingForPlayStyle === 'Competitive' ? 'need-help' : 'enjoying'}>
                {lookingForPlayStyle}
              </Badge>
            )}
          </div>
          {lookingForGameNote && <p className="mt-2 text-sm text-muted">{lookingForGameNote}</p>}
        </div>
        {error && <p className="text-sm text-frustrated">{error}</p>}
        <div>
          <Button variant="secondary" className="w-full sm:w-auto" onClick={handleStop} disabled={isSaving}>
            {isSaving ? t('lookingForGamePanel.stopping') : t('lookingForGamePanel.stopShowingMe')}
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <p className="text-sm font-medium text-text">
          {isExpanded ? t('lookingForGamePanel.makeAvailableTitle') : t('lookingForGamePanel.wantToBeFoundTitle')}
        </p>
        {isExpanded ? (
          <button
            type="button"
            onClick={() => setIsExpanded(false)}
            className="self-start text-xs font-medium text-muted hover:text-text cursor-pointer"
          >
            {t('lookingForGamePanel.cancel')}
          </button>
        ) : (
          <Button size="sm" className="w-full sm:w-auto" onClick={() => setIsExpanded(true)}>
            {t('lookingForGamePanel.makeMeAvailable')}
          </Button>
        )}
      </div>

      <div
        aria-hidden={!isExpanded}
        className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
          isExpanded ? '' : 'pointer-events-none'
        }`}
        style={{ gridTemplateRows: isExpanded ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <div className="flex flex-col gap-3 pt-1">
            <div>
              <label htmlFor="lfg-game" className="mb-1 block text-xs font-medium text-muted">
                {t('lookingForGamePanel.gameLabel')}
              </label>
              <GamePickerInput
                games={games}
                value={selectedGameId ?? ''}
                onChange={setSelectedGameId}
                error={gamesError}
                onRetry={() => setGamesLoadKey((k) => k + 1)}
                onGameAdded={(game) => setGames((current) => [...current, game].sort((a, b) => a.name.localeCompare(b.name)))}
              />
            </div>

            <div>
              <span className="mb-1 block text-xs font-medium text-muted">{t('lookingForGamePanel.playStyleLabel')}</span>
              <div className="flex gap-2">
                {playStyleOptions.map(({ value, labelKey, descriptionKey }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSelectedPlayStyle(value)}
                    title={t(descriptionKey)}
                    className={`flex-1 rounded-lg border p-2 text-center text-sm font-medium transition-colors cursor-pointer ${
                      selectedPlayStyle === value
                        ? 'border-primary bg-surface-raised text-text'
                        : 'border-border text-muted hover:bg-surface-raised'
                    }`}
                  >
                    {t(labelKey)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="lfg-note" className="mb-1 block text-xs font-medium text-muted">
                {t('lookingForGamePanel.noteLabel')}
              </label>
              <input
                id="lfg-note"
                value={note}
                onChange={(event) => setNote(event.target.value.slice(0, MAX_NOTE_LENGTH))}
                placeholder={t('lookingForGamePanel.notePlaceholder')}
                className="w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-text outline-none placeholder:text-muted focus:border-primary"
              />
              <p className="mt-1 text-right text-xs text-muted">{note.length}/{MAX_NOTE_LENGTH}</p>
            </div>

            {error && <p className="text-sm text-frustrated">{error}</p>}

            <div>
              <Button className="w-full sm:w-auto" onClick={handleStart} disabled={isSaving}>
                {isSaving ? t('lookingForGamePanel.saving') : t('lookingForGamePanel.makeMeAvailable')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
