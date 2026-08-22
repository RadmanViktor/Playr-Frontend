import type { ReactNode } from 'react'

export function AuthPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="w-full max-w-md rounded-xl border border-border bg-surface p-8">
      <div className="mb-6 flex flex-col items-center gap-2">
        <span className="text-2xl font-bold tracking-tight text-primary">PLAYR</span>
        <h1 className="text-lg font-semibold text-text">{title}</h1>
      </div>
      {children}
    </div>
  )
}
