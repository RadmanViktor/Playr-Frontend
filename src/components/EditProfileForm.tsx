import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from './ui/Button'
import { AvatarUploadInput } from './AvatarUploadInput'
import { CoverImageUploadInput } from './CoverImageUploadInput'
import {
  updateProfile,
  uploadAvatar,
  uploadCoverImage,
  type ProfileData,
  type TypicalPlayTime,
} from '../api/profilesApi'
import { ApiError } from '../api/http'

const PLATFORMS = ['PC', 'Xbox', 'PlayStation', 'Switch']
const GENRES = ['FPS', 'RPG', 'Survival', 'MMO', 'Strategy', 'Horror', 'Racing', 'Sports', 'Co-op', 'Indie']
const PLAY_TIMES: TypicalPlayTime[] = ['Evenings', 'Weekends', 'Daytime', 'Varies']

interface EditProfileFormProps {
  profile: ProfileData
  token: string
  onSave: (updated: ProfileData) => void
  onCancel: () => void
}

interface LinkRow { key: string; value: string }

export function EditProfileForm({ profile, token, onSave, onCancel }: EditProfileFormProps) {
  const { t } = useTranslation('componentsB')
  const { t: tOnboarding } = useTranslation('pagesB')
  const [displayName, setDisplayName] = useState(profile.displayName)
  const [bio, setBio] = useState(profile.bio ?? '')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null)
  const [coverImageError, setCoverImageError] = useState<string | null>(null)
  const [region, setRegion] = useState(profile.region ?? '')
  const [platforms, setPlatforms] = useState<string[]>(profile.platforms)
  const [genres, setGenres] = useState<string[]>(profile.genres)
  const [typicalPlayTimes, setTypicalPlayTimes] = useState<TypicalPlayTime[]>(profile.typicalPlayTimes)
  const [links, setLinks] = useState<LinkRow[]>(
    Object.entries(profile.externalLinks).map(([key, value]) => ({ key, value }))
  )
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  function togglePlatform(platform: string) {
    setPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    )
  }

  function toggleGenre(genre: string) {
    setGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    )
  }

  function toggleTypicalPlayTime(time: TypicalPlayTime) {
    setTypicalPlayTimes((prev) =>
      prev.includes(time) ? prev.filter((t) => t !== time) : [...prev, time]
    )
  }

  function updateLink(index: number, field: 'key' | 'value', val: string) {
    setLinks((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: val } : row)))
  }

  function removeLink(index: number) {
    setLinks((prev) => prev.filter((_, i) => i !== index))
  }

  function addLink() {
    if (links.length >= 10) return
    setLinks((prev) => [...prev, { key: '', value: '' }])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsSaving(true)
    const externalLinks: Record<string, string> = {}
    for (const { key, value } of links) {
      if (key.trim() && value.trim()) externalLinks[key.trim()] = value.trim()
    }
    try {
      if (avatarFile) {
        await uploadAvatar(token, avatarFile)
      }
      if (coverImageFile) {
        await uploadCoverImage(token, coverImageFile)
      }
      const updated = await updateProfile(token, {
        displayName: displayName.trim(),
        bio: bio.trim() || null,
        region: region.trim() || null,
        languages: profile.languages,
        platforms,
        genres,
        externalLinks,
        typicalPlayTimes,
      })
      onSave(updated)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('editProfileForm.saveError'))
    } finally {
      setIsSaving(false)
    }
  }

  const inputClass = 'rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-text outline-none focus:border-primary w-full'

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-6">
      <h2 className="text-base font-semibold text-text">{t('editProfileForm.title')}</h2>

      <label className="flex flex-col gap-1 text-sm text-muted">
        {t('editProfileForm.displayNameLabel')}
        <input className={inputClass} value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
      </label>

      <label className="flex flex-col gap-1 text-sm text-muted">
        {t('editProfileForm.bioLabel')}
        <textarea
          className={`${inputClass} resize-none h-24`}
          value={bio}
          maxLength={500}
          onChange={(e) => setBio(e.target.value)}
        />
        <span className="text-xs self-end">{t('editProfileForm.bioCounter', { count: bio.length, max: 500 })}</span>
      </label>

      <label className="flex flex-col gap-1 text-sm text-muted">
        {t('editProfileForm.avatarLabel')}
        <AvatarUploadInput
          currentAvatarUrl={profile.avatarUrl}
          displayName={profile.displayName}
          file={avatarFile}
          onFileChange={setAvatarFile}
          error={avatarError}
          onError={setAvatarError}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-muted">
        {t('editProfileForm.coverImageLabel')}
        <CoverImageUploadInput
          currentCoverImageUrl={profile.coverImageUrl}
          file={coverImageFile}
          onFileChange={setCoverImageFile}
          error={coverImageError}
          onError={setCoverImageError}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-muted">
        {t('editProfileForm.regionLabel')}
        <input className={inputClass} value={region} onChange={(e) => setRegion(e.target.value)} placeholder={t('editProfileForm.regionPlaceholder')} />
      </label>

      <div className="flex flex-col gap-2">
        <span className="text-sm text-muted">{t('editProfileForm.platformsLabel')}</span>
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map((platform) => (
            <button
              key={platform}
              type="button"
              aria-pressed={platforms.includes(platform)}
              onClick={() => togglePlatform(platform)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors cursor-pointer ${
                platforms.includes(platform) ? 'bg-primary text-white' : 'bg-surface-raised text-muted hover:text-text'
              }`}
            >
              {platform}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm text-muted">{t('editProfileForm.genresLabel')}</span>
        <div className="flex flex-wrap gap-2">
          {GENRES.map((genre) => (
            <button
              key={genre}
              type="button"
              aria-pressed={genres.includes(genre)}
              onClick={() => toggleGenre(genre)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors cursor-pointer ${
                genres.includes(genre) ? 'bg-primary text-white' : 'bg-surface-raised text-muted hover:text-text'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm text-muted">{tOnboarding('onboarding.playstyle.typicalPlayTimeLabel')}</span>
        <div className="flex flex-wrap gap-2">
          {PLAY_TIMES.map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={typicalPlayTimes.includes(value)}
              onClick={() => toggleTypicalPlayTime(value)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors cursor-pointer ${
                typicalPlayTimes.includes(value) ? 'bg-primary text-white' : 'bg-surface-raised text-muted hover:text-text'
              }`}
            >
              {tOnboarding(`onboarding.playstyle.typicalPlayTimeOptions.${value}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm text-muted">{t('editProfileForm.externalLinksLabel')}</span>
        {links.map((row, i) => (
          <div key={i} className="flex gap-2 items-center">
            <input
              className="rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-text outline-none focus:border-primary w-32"
              placeholder={t('editProfileForm.linkNamePlaceholder')}
              value={row.key}
              onChange={(e) => updateLink(i, 'key', e.target.value)}
            />
            <input
              className="rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-text outline-none focus:border-primary flex-1"
              placeholder={t('editProfileForm.linkValuePlaceholder')}
              value={row.value}
              onChange={(e) => updateLink(i, 'value', e.target.value)}
            />
            <Button type="button" variant="ghost" size="sm" onClick={() => removeLink(i)}>{t('editProfileForm.removeLink')}</Button>
          </div>
        ))}
        {links.length < 10 && (
          <Button type="button" variant="ghost" size="sm" onClick={addLink} className="self-start">
            {t('editProfileForm.addLink')}
          </Button>
        )}
      </div>

      {error && <p className="text-frustrated text-sm">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={isSaving}>{isSaving ? t('editProfileForm.saving') : t('editProfileForm.save')}</Button>
        <Button type="button" variant="ghost" onClick={onCancel}>{t('editProfileForm.cancel')}</Button>
      </div>
    </form>
  )
}
