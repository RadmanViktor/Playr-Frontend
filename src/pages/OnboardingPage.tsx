import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Gamepad2, Loader2, X } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { AvatarUploadInput } from '../components/AvatarUploadInput'
import { CoverImageUploadInput } from '../components/CoverImageUploadInput'
import { useAuth } from '../context/AuthContext'
import { ApiError, resolveMediaUrl } from '../api/http'
import { createGame, type ExternalGameSearchResult, type Game } from '../api/gamesApi'
import { updateCoverImagePosition, uploadAvatar, uploadCoverImage } from '../api/profilesApi'
import { completeOnboarding, type TypicalPlayTime } from '../api/onboardingApi'
import { useGameSearch } from '../lib/useGameSearch'

const PLATFORMS = ['PC', 'PlayStation', 'Xbox', 'Nintendo']
const GENRES = ['FPS', 'RPG', 'Survival', 'MMO', 'Strategy', 'Horror', 'Racing', 'Sports', 'Co-op', 'Indie']
const PLAY_TIMES: TypicalPlayTime[] = ['Evenings', 'Weekends', 'Daytime', 'Varies']

const TOTAL_STEPS = 6

const chipClass = (active: boolean) =>
  `rounded-full px-4 py-2 text-sm font-medium transition-colors cursor-pointer border ${
    active
      ? 'border-primary bg-primary text-white shadow-[0_0_16px_-4px_var(--color-primary)]'
      : 'border-border bg-surface-raised text-muted hover:text-text'
  }`

export default function OnboardingPage() {
  const { t } = useTranslation('pagesB')
  const { token, user, refreshOnboardingStatus } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState(1)
  const [platforms, setPlatforms] = useState<string[]>([])
  const [genres, setGenres] = useState<string[]>([])
  const [selectedGames, setSelectedGames] = useState<Game[]>([])
  const [typicalPlayTimes, setTypicalPlayTimes] = useState<TypicalPlayTime[]>([])
  const [bio, setBio] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverError, setCoverError] = useState<string | null>(null)
  const [coverPositionX, setCoverPositionX] = useState(50)
  const [coverPositionY, setCoverPositionY] = useState(50)

  const [query, setQuery] = useState('')
  const {
    results: externalResults,
    searching,
    error: searchFailed,
  } = useGameSearch(query, token, { enabled: step === 4 })
  const [addingRawgId, setAddingRawgId] = useState<number | null>(null)
  const [addError, setAddError] = useState<string | null>(null)
  const searchError = addError ?? (searchFailed ? t('onboarding.games.searchError') : null)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  function togglePlatform(platform: string) {
    setPlatforms((prev) => (prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]))
  }

  function toggleGenre(genre: string) {
    setGenres((prev) => (prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]))
  }

  function toggleTypicalPlayTime(value: TypicalPlayTime) {
    setTypicalPlayTimes((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]))
  }

  function addGameToSelection(game: Game) {
    setSelectedGames((prev) => (prev.some((g) => g.id === game.id) ? prev : [...prev, game]))
    setQuery('')
  }

  async function handleAddExternalGame(result: ExternalGameSearchResult) {
    if (!token) return
    setAddingRawgId(result.rawgId)
    try {
      const game = await createGame(token, result)
      addGameToSelection(game)
    } catch {
      setAddError(t('onboarding.games.addError'))
    } finally {
      setAddingRawgId(null)
    }
  }

  function removeGame(gameId: string) {
    setSelectedGames((prev) => prev.filter((g) => g.id !== gameId))
  }

  function goNext() {
    setStep((s) => Math.min(s + 1, TOTAL_STEPS))
  }

  function goBack() {
    setStep((s) => Math.max(s - 1, 1))
  }

  async function handleFinish() {
    if (!token) return
    setSubmitError(null)
    setIsSubmitting(true)
    try {
      if (avatarFile) {
        await uploadAvatar(token, avatarFile)
      }
      if (coverFile) {
        const uploadedCover = await uploadCoverImage(token, coverFile)
        if (
          coverPositionX !== uploadedCover.coverImagePositionX ||
          coverPositionY !== uploadedCover.coverImagePositionY
        ) {
          await updateCoverImagePosition(token, coverPositionX, coverPositionY)
        }
      }

      await completeOnboarding(token, {
        platforms,
        genres,
        gameIds: selectedGames.map((g) => g.id),
        playingNow: [],
        typicalPlayTimes,
        bio: bio.trim() || null,
      })

      await refreshOnboardingStatus()
      navigate(user ? `/profile/${user.username}` : '/')
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : t('onboarding.errors.generic'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg px-4 py-10">
      <div className="w-full max-w-xl rounded-2xl border border-border bg-surface p-8">
        <div className="mb-6 flex items-center gap-1">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <span
              key={i}
              className={`h-1.5 flex-1 rounded-full ${i < step ? 'bg-primary' : 'bg-surface-raised'}`}
            />
          ))}
        </div>

        {step === 1 && (
          <div className="flex flex-col items-center gap-4 text-center">
            <h1 className="text-2xl font-bold text-text">{t('onboarding.welcome.title')}</h1>
            <p className="text-muted">{t('onboarding.welcome.description')}</p>
            <Button onClick={goNext} className="mt-2 w-full">
              {t('onboarding.welcome.cta')}
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold text-text">{t('onboarding.platforms.title')}</h2>
            <p className="text-sm text-muted">{t('onboarding.platforms.description')}</p>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((platform) => (
                <button
                  key={platform}
                  type="button"
                  aria-pressed={platforms.includes(platform)}
                  onClick={() => togglePlatform(platform)}
                  className={chipClass(platforms.includes(platform))}
                >
                  {platform}
                </button>
              ))}
            </div>
            <StepNav onBack={goBack} onNext={goNext} />
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold text-text">{t('onboarding.genres.title')}</h2>
            <p className="text-sm text-muted">{t('onboarding.genres.description')}</p>
            <div className="flex flex-wrap gap-2">
              {GENRES.map((genre) => (
                <button
                  key={genre}
                  type="button"
                  aria-pressed={genres.includes(genre)}
                  onClick={() => toggleGenre(genre)}
                  className={chipClass(genres.includes(genre))}
                >
                  {genre}
                </button>
              ))}
            </div>
            <StepNav onBack={goBack} onNext={goNext} />
          </div>
        )}

        {step === 4 && (
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold text-text">{t('onboarding.gamesStep.title')}</h2>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('onboarding.gamesStep.searchPlaceholder')}
              className="w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-text outline-none focus:border-primary placeholder:text-muted"
            />
            {searchError && <p className="text-sm text-frustrated">{searchError}</p>}
            {searching && (
              <div className="flex items-center gap-2 text-sm text-muted">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                {t('onboarding.gamesStep.searching')}
              </div>
            )}
            {!searching && externalResults.length > 0 && (
              <div className="flex max-h-56 flex-col gap-1 overflow-y-auto rounded-lg border border-border">
                {externalResults.map((result) => (
                  <button
                    key={result.rawgId}
                    type="button"
                    disabled={addingRawgId !== null}
                    onClick={() => void handleAddExternalGame(result)}
                    className="flex items-center gap-3 px-3 py-2 text-left text-sm text-text hover:bg-surface-raised disabled:opacity-50 cursor-pointer"
                  >
                    {result.coverImageUrl ? (
                      <img src={resolveMediaUrl(result.coverImageUrl)!} alt="" className="h-8 w-8 rounded object-cover" />
                    ) : (
                      <Gamepad2 className="h-6 w-6 text-muted" aria-hidden="true" />
                    )}
                    <span className="flex-1 truncate">{result.name}</span>
                    {addingRawgId === result.rawgId && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                  </button>
                ))}
              </div>
            )}

            {selectedGames.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-sm text-muted">{t('onboarding.gamesStep.selectedLabel')}</span>
                <div className="flex flex-wrap gap-2">
                  {selectedGames.map((game) => (
                    <span
                      key={game.id}
                      className="flex items-center gap-2 rounded-full border border-border bg-surface-raised px-3 py-1.5 text-sm text-text"
                    >
                      {game.coverImageUrl ? (
                        <img src={resolveMediaUrl(game.coverImageUrl)!} alt="" className="h-5 w-5 rounded object-cover" />
                      ) : (
                        <Gamepad2 className="h-4 w-4 text-muted" aria-hidden="true" />
                      )}
                      {game.name}
                      <button
                        type="button"
                        aria-label={t('onboarding.gamesStep.removeGameAriaLabel', { name: game.name })}
                        onClick={() => removeGame(game.id)}
                        className="text-muted hover:text-text cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
            <StepNav onBack={goBack} onNext={goNext} />
          </div>
        )}

        {step === 5 && (
          <div className="flex flex-col gap-5">
            <h2 className="text-xl font-semibold text-text">{t('onboarding.playstyle.title')}</h2>

            <div className="flex flex-col gap-2">
              <span className="text-sm text-muted">{t('onboarding.playstyle.typicalPlayTimeLabel')}</span>
              <div className="flex flex-wrap gap-2">
                {PLAY_TIMES.map((value) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={typicalPlayTimes.includes(value)}
                    onClick={() => toggleTypicalPlayTime(value)}
                    className={chipClass(typicalPlayTimes.includes(value))}
                  >
                    {t(`onboarding.playstyle.typicalPlayTimeOptions.${value}`)}
                  </button>
                ))}
              </div>
            </div>

            <StepNav onBack={goBack} onNext={goNext} />
          </div>
        )}

        {step === 6 && (
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold text-text">{t('onboarding.customization.title')}</h2>

            <label className="flex flex-col gap-1 text-sm text-muted">
              {t('onboarding.customization.avatarLabel')}
              <AvatarUploadInput
                currentAvatarUrl={null}
                displayName="?"
                file={avatarFile}
                onFileChange={setAvatarFile}
                error={avatarError}
                onError={setAvatarError}
              />
            </label>

            <label className="flex flex-col gap-1 text-sm text-muted">
              {t('onboarding.customization.coverLabel')}
              <CoverImageUploadInput
                currentCoverImageUrl={null}
                file={coverFile}
                onFileChange={(selected) => {
                  setCoverFile(selected)
                  if (selected) {
                    setCoverPositionX(50)
                    setCoverPositionY(50)
                  }
                }}
                error={coverError}
                onError={setCoverError}
                positionX={coverPositionX}
                positionY={coverPositionY}
                onPositionChange={(x, y) => {
                  setCoverPositionX(x)
                  setCoverPositionY(y)
                }}
              />
            </label>

            <label className="flex flex-col gap-1 text-sm text-muted">
              {t('onboarding.customization.bioLabel')}
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={500}
                className="h-24 w-full resize-none rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-text outline-none focus:border-primary"
              />
            </label>

            {submitError && <p className="text-sm text-frustrated">{submitError}</p>}

            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={goBack} disabled={isSubmitting}>
                {t('onboarding.back')}
              </Button>
              <Button type="button" onClick={handleFinish} disabled={isSubmitting} className="flex-1">
                {isSubmitting ? t('onboarding.finishing') : t('onboarding.customization.finish')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function StepNav({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  const { t } = useTranslation('pagesB')
  return (
    <div className="flex gap-2">
      <Button type="button" variant="ghost" onClick={onBack}>
        {t('onboarding.back')}
      </Button>
      <Button type="button" onClick={onNext} className="flex-1">
        {t('onboarding.next')}
      </Button>
    </div>
  )
}
