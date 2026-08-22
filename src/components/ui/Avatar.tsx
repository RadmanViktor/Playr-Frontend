type Size = 'sm' | 'md' | 'lg' | 'xl'
type Status = 'online' | 'in-game' | 'offline'

interface AvatarProps {
  src?: string
  alt: string
  size?: Size
  status?: Status
}

const sizeClasses: Record<Size, string> = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-24 w-24 text-3xl',
}

const statusColor: Record<Status, string> = {
  online: 'bg-enjoying',
  'in-game': 'bg-need-help',
  offline: 'bg-muted',
}

export function Avatar({ src, alt, size = 'md', status }: AvatarProps) {
  return (
    <span className={`relative inline-flex shrink-0 ${sizeClasses[size]}`}>
      {src ? (
        <img
          src={src}
          alt={alt}
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
}
