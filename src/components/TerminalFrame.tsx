import type { ReactNode } from 'react'

export function TerminalFrame({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="w-full max-w-md border border-[#39ff14] text-[#39ff14]">
      <div className="border-b border-[#39ff14] px-4 py-2 text-sm uppercase tracking-wide">
        {`> ${title}`}
      </div>
      <div className="px-6 py-8">{children}</div>
    </div>
  )
}
