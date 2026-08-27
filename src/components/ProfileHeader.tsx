import { Globe, Link as LinkIcon, FileText, Calendar } from 'lucide-react'
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
}

const statusAvatarMap: Record<ProfileData['status'], AvatarStatus> = {
  Online: 'online',
  LookingForGame: 'looking-for-game',
  Busy: 'busy',
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
}: ProfileHeaderProps) {
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
        <div className="flex items-start justify-between gap-4">
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
            <div className="flex flex-col items-end gap-2">
              <Button variant="secondary" size="sm" onClick={onEditClick}>
                Edit Profile
              </Button>
              {onSignOutClick && (
                <Button variant="ghost" size="sm" onClick={onSignOutClick}>
                  Sign out
                </Button>
              )}
            </div>
          )}
          {!isOwner && (
            <div className="flex flex-col items-end gap-2">
              {profile.relationshipStatus === 'Friends' && <Badge variant="completed">Friend</Badge>}
              {profile.relationshipStatus === 'InvitePending' && (
                <>
                  <Badge variant="tag">Request sent</Badge>
                  {profile.pendingInvitationId && onCancelFriendRequestClick && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onCancelFriendRequestClick}
                      disabled={isCancellingFriendRequest}
                    >
                      {isCancellingFriendRequest ? 'Cancelling...' : 'Cancel request'}
                    </Button>
                  )}
                </>
              )}
              {(profile.relationshipStatus === 'None' || profile.relationshipStatus === null) && onAddFriendClick && (
                <Button size="sm" onClick={onAddFriendClick}>
                  Add friend
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-5 text-sm text-muted">
          <span className="flex items-center gap-1.5">
            <FileText className="h-4 w-4" aria-hidden="true" />
            <span className="font-semibold text-text">{postCount}</span> posts
          </span>
          {profile.region && (
            <span className="flex items-center gap-1.5">
              <Globe className="h-4 w-4" aria-hidden="true" />
              {profile.region}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" aria-hidden="true" />
            Joined {formatJoinDate(profile.createdAt)}
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
