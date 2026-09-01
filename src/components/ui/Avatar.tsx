import { useState } from 'react'
import { resolveMediaUrl } from '../../api/http'

type Size = 'sm' | 'md' | 'lg' | 'xl'
export type AvatarStatus = 'online' | 'looking-for-game' | 'busy' | 'inactive' | 'offline'

interface AvatarProps {
  src?: string
  alt: string
  size?: Size
  status?: AvatarStatus
  /** Active badge type from the profile/post/comment DTOs, e.g. "Creator", "Poster". */
  badgeType?: string | null
  /** Active badge level, e.g. "Bronze", "Silver", "Gold". */
  badgeLevel?: string | null
}

const sizeClasses: Record<Size, string> = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-24 w-24 text-3xl',
}

const statusColor: Record<AvatarStatus, string> = {
  online: 'bg-enjoying',
  'looking-for-game': 'bg-need-help',
  busy: 'bg-frustrated',
  inactive: 'bg-muted',
  offline: 'bg-muted',
}

/**
 * Maps a badge type/level to the CSS ring class defined in index.css. "Creator" and
 * "Admin" get their own animated neon rings (pink/purple/blue vs. red/orange), and
 * "FirstHundredUsers" gets a gold/white glitter ring, all regardless of level;
 * everything else gets a plain ring colored by tier.
 * Returns null if there's no badge to show.
 */
function getBadgeRingClass(badgeType?: string | null, badgeLevel?: string | null): string | null {
  if (!badgeType) return null
  if (badgeType === 'Creator') return 'badge-ring-creator'
  if (badgeType === 'FirstHundredUsers') return 'badge-ring-founder'
  if (badgeType === 'Admin') return 'badge-ring-admin'
  switch (badgeLevel) {
    case 'Bronze':
      return 'badge-ring-bronze'
    case 'Silver':
      return 'badge-ring-silver'
    case 'Gold':
      return 'badge-ring-gold'
    default:
      return null
  }
}

export function Avatar({ src, alt, size = 'md', status, badgeType, badgeLevel }: AvatarProps) {
  // The API returns server-relative avatar paths. Resolving here rather than at
  // each of the ~10 call sites keeps them from silently rendering broken images.
  const resolvedSrc = resolveMediaUrl(src)

  // Storing the failed URL rather than a boolean means a later src change
  // retries automatically, with no effect needed to reset the flag.
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const showImage = resolvedSrc !== null && resolvedSrc !== failedSrc

  const avatar = (
    // overflow-hidden: a broken image renders its alt text at the element's
    // intrinsic size, which otherwise escapes the avatar box and wrecks the
    // surrounding layout.
    <span className={`relative inline-flex shrink-0 overflow-hidden ${sizeClasses[size]}`}>
      {showImage ? (
        <img
          src={resolvedSrc}
          alt={alt}
          onError={() => setFailedSrc(resolvedSrc)}
          className="h-full w-full rounded-full object-cover"
        />
      ) : (
        <span
          aria-label={alt}
          className="flex h-full w-full items-center justify-center rounded-full bg-surface-raised font-semibold text-text uppercase"
        >
          {alt.charAt(0)}
        </span>
      )}
      {status && (
        <span
          data-testid="avatar-status"
          data-status={status}
          className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-surface ${statusColor[status]}`}
        />
      )}
    </span>
  )

  const ringClass = getBadgeRingClass(badgeType, badgeLevel)
  if (!ringClass) {
    return avatar
  }

  return (
    <span
      data-testid="avatar-badge-ring"
      data-badge-type={badgeType}
      data-badge-level={badgeLevel ?? undefined}
      title={badgeType === 'Creator' ? 'Creator' : `${badgeType} (${badgeLevel})`}
      className={`badge-ring ${ringClass}`}
    >
      {avatar}
    </span>
  )
}
