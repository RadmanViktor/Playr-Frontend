import { useState } from 'react'
import { Button } from './ui/Button'
import { updateProfile, type ProfileData } from '../api/profilesApi'
import { ApiError } from '../api/http'

const PLATFORMS = ['PC', 'Xbox', 'PlayStation', 'Switch']

interface EditProfileFormProps {
  profile: ProfileData
  token: string
  onSave: (updated: ProfileData) => void
  onCancel: () => void
}

interface LinkRow { key: string; value: string }

export function EditProfileForm({ profile, token, onSave, onCancel }: EditProfileFormProps) {
  const [displayName, setDisplayName] = useState(profile.displayName)
  const [bio, setBio] = useState(profile.bio ?? '')
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl ?? '')
  const [region, setRegion] = useState(profile.region ?? '')
  const [platforms, setPlatforms] = useState<string[]>(profile.platforms)
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
      const updated = await updateProfile(token, {
        displayName: displayName.trim(),
        bio: bio.trim() || null,
        avatarUrl: avatarUrl.trim() || null,
        region: region.trim() || null,
        languages: profile.languages,
        platforms,
        externalLinks,
        currentlyPlayingGames: profile.currentlyPlayingGames,
        lookingForPlayers: profile.lookingForPlayers,
      })
      onSave(updated)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.')
    } finally {
      setIsSaving(false)
    }
  }

  const inputClass = 'rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-text outline-none focus:border-primary w-full'

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-6">
      <h2 className="text-base font-semibold text-text">Edit Profile</h2>

      <label className="flex flex-col gap-1 text-sm text-muted">
        Display name
        <input className={inputClass} value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
      </label>

      <label className="flex flex-col gap-1 text-sm text-muted">
        Bio
        <textarea
          className={`${inputClass} resize-none h-24`}
          value={bio}
          maxLength={500}
          onChange={(e) => setBio(e.target.value)}
        />
        <span className="text-xs self-end">{bio.length} / 500</span>
      </label>

      <label className="flex flex-col gap-1 text-sm text-muted">
        Avatar URL
        <input className={inputClass} value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://..." />
      </label>

      <label className="flex flex-col gap-1 text-sm text-muted">
        Region
        <input className={inputClass} value={region} onChange={(e) => setRegion(e.target.value)} placeholder="e.g. EU, NA, AS" />
      </label>

      <div className="flex flex-col gap-2">
        <span className="text-sm text-muted">Platforms</span>
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map((platform) => (
            <button
              key={platform}
              type="button"
              aria-pressed={platforms.includes(platform)}
              onClick={() => togglePlatform(platform)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                platforms.includes(platform) ? 'bg-primary text-white' : 'bg-surface-raised text-muted hover:text-text'
              }`}
            >
              {platform}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm text-muted">External links</span>
        {links.map((row, i) => (
          <div key={i} className="flex gap-2 items-center">
            <input
              className="rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-text outline-none focus:border-primary w-32"
              placeholder="Name"
              value={row.key}
              onChange={(e) => updateLink(i, 'key', e.target.value)}
            />
            <input
              className="rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-text outline-none focus:border-primary flex-1"
              placeholder="URL or username"
              value={row.value}
              onChange={(e) => updateLink(i, 'value', e.target.value)}
            />
            <Button type="button" variant="ghost" size="sm" onClick={() => removeLink(i)}>✕</Button>
          </div>
        ))}
        {links.length < 10 && (
          <Button type="button" variant="ghost" size="sm" onClick={addLink} className="self-start">
            + Add link
          </Button>
        )}
      </div>

      {error && <p className="text-frustrated text-sm">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving…' : 'Save'}</Button>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  )
}
