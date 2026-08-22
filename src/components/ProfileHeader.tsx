import { Globe } from 'lucide-react'
import { Avatar } from './ui/Avatar'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'
import type { ProfileData } from '../api/profilesApi'

interface ProfileHeaderProps {
  profile: ProfileData
  isOwner: boolean
  onEditClick: () => void
}

export function ProfileHeader({ profile, isOwner, onEditClick }: ProfileHeaderProps) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar
            src={profile.avatarUrl ?? undefined}
            alt={profile.displayName}
            size="lg"
          />
          <div>
            <h1 className="text-xl font-bold text-text">{profile.displayName}</h1>
            <p className="text-sm text-muted">@{profile.username}</p>
          </div>
        </div>
        {isOwner && (
          <Button variant="secondary" size="sm" onClick={onEditClick}>
            Edit Profile
          </Button>
        )}
      </div>

      {profile.bio && (
        <p className="text-sm text-text leading-relaxed">{profile.bio}</p>
      )}

      {profile.region && (
        <div className="flex items-center gap-1.5 text-sm text-muted">
          <Globe className="h-4 w-4" aria-hidden="true" />
          <span>{profile.region}</span>
        </div>
      )}

      {profile.platforms.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {profile.platforms.map((platform) => (
            <Badge key={platform} variant="tag">{platform}</Badge>
          ))}
        </div>
      )}

      {Object.entries(profile.externalLinks).length > 0 && (
        <div className="flex flex-col gap-1">
          {Object.entries(profile.externalLinks).map(([key, value]) => (
            <a
              key={key}
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline"
            >
              {key}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
