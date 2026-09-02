import type { ReactNode } from 'react'

interface AuthPanelProps {
  title: string
  children: ReactNode
  eyebrow?: string
  description?: string
}

export function AuthPanel({ title, children, eyebrow, description }: AuthPanelProps) {
  return (
    <section className="w-full rounded-2xl border border-white/8 bg-surface/85 p-6 shadow-[0_28px_90px_-35px_rgba(0,0,0,0.9)] backdrop-blur-xl sm:p-8">
      <div className="mb-7">
        {eyebrow && (
          <p className="mb-2 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-primary">
            {eyebrow}
          </p>
        )}
        <h1 className="text-3xl font-bold tracking-[-0.04em] text-text">{title}</h1>
        {description && <p className="mt-2 text-sm leading-6 text-muted">{description}</p>}
      </div>
      {children}
    </section>
  )
}
