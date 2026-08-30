import { Globe, Link as LinkIcon, FileText, Calendar } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Avatar, type AvatarStatus } from './ui/Avatar'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'
import type { ProfileData } from '../api/profilesApi'

interface ProfileHeaderProps {
  profile: ProfileData
  isOwner: boolean
  onEditClick: () => void
  onSignOutClick?: () => void
  postCount?: number
  onAddFriendClick?: () => void
  onCancelFriendRequestClick?: () => void
  isCancellingFriendRequest?: boolean
  onMessageClick?: () => void
  isFriendRequestPending?: boolean
}

const statusAvatarMap: Record<ProfileData['status'], AvatarStatus> = {
  Online: 'online',
  LookingForGame: 'looking-for-game',
  Busy: 'busy',
  Inactive: 'inactive',
  Offline: 'offline',
}

function formatJoinDate(createdAt: string): string {
  return new Date(createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}

export function ProfileHeader({
  profile,
  isOwner,
  onEditClick,
  onSignOutClick,
  postCount = 0,
  onAddFriendClick,
  onCancelFriendRequestClick,
  isCancellingFriendRequest = false,
  onMessageClick,
  isFriendRequestPending = false,
}: ProfileHeaderProps) {
  const { t } = useTranslation('componentsB')
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      {/* Gradient banner */}
      <div className="relative h-32 bg-gradient-to-br from-primary/60 via-primary/25 to-surface sm:h-40">
        <div className="absolute -bottom-12 left-6">
          <Avatar
            src={profile.avatarUrl ?? undefined}
            alt={profile.displayName}
            size="xl"
            status={statusAvatarMap[profile.status]}
          />
        </div>
      </div>

      <div className="flex flex-col gap-4 px-6 pb-6 pt-16">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
          <div>
            <h1 className="text-xl font-bold text-text">
              {profile.displayName.toLowerCase() === profile.username.toLowerCase()
                ? `@${profile.username}`
                : profile.displayName}
            </h1>
            {profile.displayName.toLowerCase() !== profile.username.toLowerCase() && (
              <p className="text-sm text-muted">@{profile.username}</p>
            )}
          </div>
          {isOwner && (
            <div className="flex flex-col items-start gap-2 sm:items-end">
              <Button variant="secondary" size="sm" onClick={onEditClick}>
                {t('profileHeader.settings')}
              </Button>
              {onSignOutClick && (
                <Button variant="ghost" size="sm" onClick={onSignOutClick}>
                  {t('profileHeader.signOut')}
                </Button>
              )}
            </div>
          )}
          {!isOwner && (
            <div className="flex flex-col items-start gap-2 sm:items-end">
              {onMessageClick && (
                <Button variant="secondary" size="sm" onClick={onMessageClick}>
                  {t('profileHeader.message')}
                </Button>
              )}
              {profile.relationshipStatus === 'Friends' && <Badge variant="completed">{t('profileHeader.friend')}</Badge>}
              {profile.relationshipStatus !== 'Friends' && isFriendRequestPending && (
                <>
                  <Badge variant="tag">{t('profileHeader.requestSent')}</Badge>
                  {onCancelFriendRequestClick && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onCancelFriendRequestClick}
                      disabled={isCancellingFriendRequest}
                    >
                      {isCancellingFriendRequest ? t('profileHeader.cancelling') : t('profileHeader.cancelRequest')}
                    </Button>
                  )}
                </>
              )}
              {profile.relationshipStatus !== 'Friends' && !isFriendRequestPending && onAddFriendClick && (
                <Button size="sm" onClick={onAddFriendClick}>
                  {t('profileHeader.addFriend')}
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted">
          <span className="flex items-center gap-1.5">
            <FileText className="h-4 w-4" aria-hidden="true" />
            <span className="font-semibold text-text">{postCount}</span> {t('profileHeader.posts', { count: postCount })}
          </span>
          {profile.region && (
            <span className="flex items-center gap-1.5">
              <Globe className="h-4 w-4" aria-hidden="true" />
              {profile.region}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" aria-hidden="true" />
            {t('profileHeader.joined', { date: formatJoinDate(profile.createdAt) })}
          </span>
        </div>

        {profile.bio && (
          <p className="text-sm text-text leading-relaxed">{profile.bio}</p>
        )}

        {profile.platforms.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {profile.platforms.map((platform) => (
              <Badge key={platform} variant="tag">{platform}</Badge>
            ))}
          </div>
        )}

        {Object.entries(profile.externalLinks).length > 0 && (
          <div className="flex flex-wrap gap-4 border-t border-border pt-4">
            {Object.entries(profile.externalLinks).map(([key, value]) => (
              <a
                key={key}
                href={value}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                <LinkIcon className="h-3.5 w-3.5" aria-hidden="true" />
                {key}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
