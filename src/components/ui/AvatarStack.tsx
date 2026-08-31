import { Avatar } from './Avatar'

type Size = 'sm' | 'md' | 'lg' | 'xl'

interface AvatarStackParticipant {
  userId: string
  displayName: string
  avatarUrl?: string | null
}

interface AvatarStackProps {
  participants: AvatarStackParticipant[]
  size?: Size
  /** Maximum number of avatars to render before collapsing the rest into a "+N" badge. */
  max?: number
}

const sizePx: Record<Size, number> = {
  sm: 32,
  md: 40,
  lg: 48,
  xl: 96,
}

const overlapOffset: Record<Size, number> = {
  sm: 14,
  md: 18,
  lg: 22,
  xl: 40,
}

const extraBadgeTextSize: Record<Size, string> = {
  sm: 'text-[10px]',
  md: 'text-xs',
  lg: 'text-sm',
  xl: 'text-lg',
}

/**
 * Renders a set of overlapping avatars (e.g. for a group chat header or conversation
 * list row), most-recent/first-listed on top. Falls back to a single generic avatar
 * when there are no participants to show.
 */
export function AvatarStack({ participants, size = 'sm', max = 3 }: AvatarStackProps) {
  if (participants.length === 0) {
    return <Avatar alt="Group" size={size} />
  }

  const visible = participants.slice(0, max)
  const extraCount = participants.length - visible.length
  const step = overlapOffset[size]
  const width = sizePx[size] + step * (visible.length - 1 + (extraCount > 0 ? 1 : 0))

  return (
    <span className="relative inline-block shrink-0" style={{ width, height: sizePx[size] }}>
      {visible.map((participant, index) => (
        <span
          key={participant.userId}
          className="absolute top-0 rounded-full ring-2 ring-surface"
          style={{ left: index * step, zIndex: visible.length - index }}
        >
          <Avatar src={participant.avatarUrl ?? undefined} alt={participant.displayName} size={size} />
        </span>
      ))}
      {extraCount > 0 && (
        <span
          className={`absolute top-0 flex items-center justify-center rounded-full bg-surface-raised font-semibold text-text ring-2 ring-surface ${extraBadgeTextSize[size]}`}
          style={{ left: visible.length * step, width: sizePx[size], height: sizePx[size], zIndex: 0 }}
        >
          +{extraCount}
        </span>
      )}
    </span>
  )
}
