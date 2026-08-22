import type { ReactNode } from 'react'

export function RightRail({ children }: { children: ReactNode }) {
  return (
    <aside className="hidden w-80 shrink-0 flex-col gap-4 border-l border-border bg-surface p-4 xl:flex">
      {children}
    </aside>
  )
}
