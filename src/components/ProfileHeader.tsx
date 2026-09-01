import { Globe, Link as LinkIcon, FileText, Calendar, UserPlus, UserCheck, UserRoundPlus, MessageCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Avatar, type AvatarStatus } from './ui/Avatar'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'
import { resolveMediaUrl } from '../api/http'
import type { ProfileData, ProfileStatus } from '../api/profilesApi'

const statusAvatarMap: Record<ProfileStatus, AvatarStatus> = {
  Online: 'online',
  LookingForGame: 'looking-for-game',
  Busy: 'busy',
  Inactive: 'inactive',
  Offline: 'offline',
}

interface ProfileHeaderProps {
  profile: ProfileData
  isOwner: boolean
  postCount?: number
  onAddFriendClick?: () => void
  onCancelFriendRequestClick?: () => void
  isCancellingFriendRequest?: boolean
  onMessageClick?: () => void
  isFriendRequestPending?: boolean
  isFollowing?: boolean
  isFollowLoading?: boolean
  onFollowClick?: () => void
  onUnfollowClick?: () => void
  followersCount?: number
  followingCount?: number
  friendsCount?: number
  onFollowersClick?: () => void
  onFollowingClick?: () => void
}

function formatJoinDate(createdAt: string): string {
  return new Date(createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}

export function ProfileHeader({
  profile,
  isOwner,
  postCount = 0,
  onAddFriendClick,
  onCancelFriendRequestClick,
  isCancellingFriendRequest = false,
  onMessageClick,
  isFriendRequestPending = false,
  isFollowing = false,
  isFollowLoading = false,
  onFollowClick,
  onUnfollowClick,
  followersCount = 0,
  followingCount = 0,
  friendsCount = 0,
  onFollowersClick,
  onFollowingClick,
}: ProfileHeaderProps) {
  const { t } = useTranslation('componentsB')
  const { t: tOnboarding } = useTranslation('pagesB')
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      {/* Cover image / gradient banner */}
      <div
        className="relative h-56 bg-gradient-to-br from-primary/60 via-primary/25 to-surface bg-cover bg-center sm:h-72"
        style={profile.coverImageUrl ? { backgroundImage: `url(${resolveMediaUrl(profile.coverImageUrl)})` } : undefined}
      >
        {profile.coverImageUrl && (
          <>
            {/* Subtle darken so the banner reads as a backdrop rather than raw photo */}
            <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/10 to-black/10" />
            {/* Purple brand tint to tie the image into PLAYR's palette */}
            <div className="absolute inset-0 bg-primary/10 mix-blend-overlay" />
          </>
        )}
        <div className="absolute -bottom-12 left-6 rounded-full ring-4 ring-surface shadow-lg">
          <Avatar
            src={profile.avatarUrl ?? undefined}
            alt={profile.displayName}
            size="xl"
            status={statusAvatarMap[profile.status]}
            badgeType={profile.activeBadgeType}
            badgeLevel={profile.activeBadgeLevel}
          />
        </div>
      </div>

      <div className="flex flex-col gap-4 px-6 pb-6 pt-16">
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
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
          {!isOwner && (
            <div className="flex flex-wrap items-center gap-2">
              {(onFollowClick || onUnfollowClick) && (
                <Button
                  variant={isFollowing ? 'secondary' : 'primary'}
                  size="sm"
                  onClick={isFollowing ? onUnfollowClick : onFollowClick}
                  disabled={isFollowLoading}
                >
                  {isFollowing ? (
                    <UserCheck className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <UserPlus className="h-4 w-4" aria-hidden="true" />
                  )}
                  {isFollowLoading
                    ? t('profileHeader.followLoading')
                    : isFollowing
                      ? t('profileHeader.following')
                      : t('profileHeader.follow')}
                </Button>
              )}
              {onMessageClick && (
                <Button variant="secondary" size="sm" onClick={onMessageClick}>
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
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
                  <UserRoundPlus className="h-4 w-4" aria-hidden="true" />
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
          {onFollowersClick ? (
            <button
              type="button"
              onClick={onFollowersClick}
              className="flex items-center gap-1.5 cursor-pointer hover:text-text hover:underline"
            >
              <span className="font-semibold text-text">{followersCount}</span> {t('profileHeader.followers', { count: followersCount })}
            </button>
          ) : (
            <span className="flex items-center gap-1.5">
              <span className="font-semibold text-text">{followersCount}</span> {t('profileHeader.followers', { count: followersCount })}
            </span>
          )}
          {onFollowingClick ? (
            <button
              type="button"
              onClick={onFollowingClick}
              className="flex items-center gap-1.5 cursor-pointer hover:text-text hover:underline"
            >
              <span className="font-semibold text-text">{followingCount}</span> {t('profileHeader.followingCount', { count: followingCount })}
            </button>
          ) : (
            <span className="flex items-center gap-1.5">
              <span className="font-semibold text-text">{followingCount}</span> {t('profileHeader.followingCount', { count: followingCount })}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <span className="font-semibold text-text">{friendsCount}</span> {t('profileHeader.friendsCount', { count: friendsCount })}
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
          <p className="text-sm text-text leading-snug line-clamp-3">{profile.bio}</p>
        )}

        {(profile.platforms.length > 0 || profile.genres.length > 0 || profile.typicalPlayTimes.length > 0) && (
          <div className="flex flex-wrap gap-2">
            {profile.platforms.map((platform) => (
              <Badge key={`platform-${platform}`} variant="tag">{platform}</Badge>
            ))}
            {profile.genres.map((genre) => (
              <Badge key={`genre-${genre}`} variant="tag">{genre}</Badge>
            ))}
            {profile.typicalPlayTimes.map((time) => (
              <Badge key={`playtime-${time}`} variant="tag">
                {tOnboarding(`onboarding.playstyle.typicalPlayTimeOptions.${time}`)}
              </Badge>
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
