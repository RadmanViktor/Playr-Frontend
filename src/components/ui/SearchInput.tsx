import type { InputHTMLAttributes } from 'react'
import { Search } from 'lucide-react'

export function SearchInput({
  className = '',
  placeholder = 'Search PLAYR',
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-raised px-3 py-2">
      <Search className="h-4 w-4 text-muted" aria-hidden="true" />
      <input
        type="search"
        aria-label="Search PLAYR"
        placeholder={placeholder}
        className={`w-full bg-transparent text-sm text-text outline-none placeholder:text-muted ${className}`}
        {...props}
      />
    </div>
  )
}
