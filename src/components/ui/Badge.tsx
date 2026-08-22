import type { ReactNode } from 'react'

type Variant = 'enjoying' | 'need-help' | 'frustrated' | 'completed' | 'tag'

interface BadgeProps {
  children: ReactNode
  variant?: Variant
}

const variantClasses: Record<Variant, string> = {
  enjoying: 'bg-enjoying/15 text-enjoying',
  'need-help': 'bg-need-help/15 text-need-help',
  frustrated: 'bg-frustrated/15 text-frustrated',
  completed: 'bg-completed/15 text-completed',
  tag: 'bg-surface-raised text-muted',
}

export function Badge({ children, variant = 'tag' }: BadgeProps) {
  return (
    <span
      data-variant={variant}
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variantClasses[variant]}`}
    >
      {children}
    </span>
  )
}
