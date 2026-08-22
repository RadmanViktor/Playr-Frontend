import type { ReactNode } from 'react'

export function Card({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`rounded-xl border border-border bg-surface p-4 ${className}`}>
      {children}
    </div>
  )
}

export function CardHeader({
  title,
  icon,
  action,
}: {
  title: string
  icon?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        {icon && <span className="text-primary">{icon}</span>}
        <h2 className="text-sm font-semibold text-text">{title}</h2>
      </div>
      {action && <div className="text-xs text-primary">{action}</div>}
    </div>
  )
}
