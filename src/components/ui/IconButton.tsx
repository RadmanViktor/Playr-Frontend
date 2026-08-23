import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  'aria-label': string
}

export function IconButton({ children, className = '', ...props }: IconButtonProps) {
  return (
    <button
      className={`flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors cursor-pointer hover:bg-surface-raised hover:text-text ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
