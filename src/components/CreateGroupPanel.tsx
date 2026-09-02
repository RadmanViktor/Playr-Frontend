import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Minus, Plus } from 'lucide-react'
import { Card } from './ui/Card'
import { Button } from './ui/Button'
import { GamePickerInput } from './GamePickerInput'
import type { Game } from '../api/gamesApi'
import type { PlayStyle } from '../api/profilesApi'
import { createLfgGroup } from '../api/lfgGroupsApi'
import { useAuth } from '../context/AuthContext'
import { ApiError } from '../api/http'
import { AgePreferenceFields } from './AgePreferenceFields'
import { isValidAgePreference } from '../utils/agePreference'

interface CreateGroupPanelProps {
  onChanged: () => void
}

const playStyleOptions: { value: PlayStyle; labelKey: string; descriptionKey: string }[] = [
  { value: 'Competitive', labelKey: 'lookingForGamePanel.playStyleCompetitive', descriptionKey: 'lookingForGamePanel.playStyleCompetitiveDescription' },
  { value: 'Chill', labelKey: 'lookingForGamePanel.playStyleChill', descriptionKey: 'lookingForGamePanel.playStyleChillDescription' },
]

const MAX_NOTE_LENGTH = 200
const MIN_PLAYERS_WANTED = 1
const MAX_PLAYERS_WANTED = 10
const DEFAULT_PLAYERS_WANTED = 3

export function CreateGroupPanel({ onChanged }: CreateGroupPanelProps) {
  const { t } = useTranslation('componentsB')
  const { token } = useAuth()

  const [selectedGame, setSelectedGame] = useState<Game | null>(null)
  const [selectedPlayStyle, setSelectedPlayStyle] = useState<PlayStyle | null>(null)
  const [playersWanted, setPlayersWanted] = useState(DEFAULT_PLAYERS_WANTED)
  const [note, setNote] = useState('')
  const [minAge, setMinAge] = useState('')
  const [maxAge, setMaxAge] = useState('')
  const [microphoneRequired, setMicrophoneRequired] = useState(false)
  const [ageError, setAgeError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function adjustPlayersWanted(delta: number) {
    setPlayersWanted((prev) => Math.min(MAX_PLAYERS_WANTED, Math.max(MIN_PLAYERS_WANTED, prev + delta)))
  }

  async function handleCreate() {
    setError(null)
    setAgeError(null)
    if (!selectedGame) {
      setError(t('createGroupPanel.chooseGame'))
      return
    }
    if (!token) {
      setError(t('createGroupPanel.createError'))
      return
    }
    const preferredMinAge = minAge === '' ? null : Number(minAge)
    const preferredMaxAge = maxAge === '' ? null : Number(maxAge)
    if (!isValidAgePreference(preferredMinAge, preferredMaxAge)) {
      setAgeError(t('agePreference.invalid'))
      return
    }

    setIsSaving(true)
    try {
      await createLfgGroup(token, {
        gameId: selectedGame.id,
        playersWanted,
        playStyle: selectedPlayStyle,
        note: note.trim() || null,
        preferredMinAge,
        preferredMaxAge,
        microphoneRequired,
      })
      setSelectedGame(null)
      setSelectedPlayStyle(null)
      setPlayersWanted(DEFAULT_PLAYERS_WANTED)
      setNote('')
      setMinAge('')
      setMaxAge('')
      setMicrophoneRequired(false)
      onChanged()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('createGroupPanel.createError'))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card className="flex flex-col gap-3">
      <div>
        <label htmlFor="lfg-group-game" className="mb-1 block text-xs font-medium text-muted">
          {t('lookingForGamePanel.gameLabel')}
        </label>
        <GamePickerInput selectedGame={selectedGame} onSelect={setSelectedGame} />
      </div>

      <AgePreferenceFields
        idPrefix="lfg-group"
        minAge={minAge}
        maxAge={maxAge}
        onMinAgeChange={(value) => {
          setMinAge(value)
          setAgeError(null)
        }}
        onMaxAgeChange={(value) => {
          setMaxAge(value)
          setAgeError(null)
        }}
        error={ageError}
      />

      <label className="flex cursor-pointer items-center gap-2 text-sm text-text">
        <input
          type="checkbox"
          checked={microphoneRequired}
          onChange={(event) => setMicrophoneRequired(event.target.checked)}
          className="h-4 w-4 accent-primary"
        />
        {t('createGroupPanel.microphoneRequiredLabel')}
      </label>

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
        <span className="mb-1 block text-xs font-medium text-muted">{t('createGroupPanel.playersWantedLabel')}</span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label={t('createGroupPanel.decreasePlayersWantedAriaLabel')}
            onClick={() => adjustPlayersWanted(-1)}
            disabled={playersWanted <= MIN_PLAYERS_WANTED}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-text hover:bg-surface-raised disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            <Minus className="h-4 w-4" aria-hidden="true" />
          </button>
          <span className="w-8 text-center text-sm font-semibold text-text">{playersWanted}</span>
          <button
            type="button"
            aria-label={t('createGroupPanel.increasePlayersWantedAriaLabel')}
            onClick={() => adjustPlayersWanted(1)}
            disabled={playersWanted >= MAX_PLAYERS_WANTED}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-text hover:bg-surface-raised disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div>
        <label htmlFor="lfg-group-note" className="mb-1 block text-xs font-medium text-muted">
          {t('lookingForGamePanel.noteLabel')}
        </label>
        <input
          id="lfg-group-note"
          value={note}
          onChange={(event) => setNote(event.target.value.slice(0, MAX_NOTE_LENGTH))}
          placeholder={t('lookingForGamePanel.notePlaceholder')}
          className="w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-text outline-none placeholder:text-muted focus:border-primary"
        />
        <p className="mt-1 text-right text-xs text-muted">{note.length}/{MAX_NOTE_LENGTH}</p>
      </div>

      {error && <p className="text-sm text-frustrated">{error}</p>}

      <div>
        <Button className="w-full sm:w-auto" onClick={handleCreate} disabled={isSaving}>
          {isSaving ? t('createGroupPanel.creating') : t('createGroupPanel.createGroup')}
        </Button>
      </div>
    </Card>
  )
}
