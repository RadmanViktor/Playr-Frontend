import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface SelectProps {
  options: SelectOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  id?: string
  className?: string
  disabled?: boolean
  'aria-label'?: string
}

export function Select({
  options,
  value,
  onChange,
  placeholder = 'Select…',
  id,
  className = '',
  disabled,
  ...rest
}: SelectProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selected = options.find((o) => o.value === value) ?? null

  useEffect(() => {
    if (!open) return
    function handleMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [open])

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        id={id}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center gap-2 rounded-lg border border-border bg-surface-raised px-3 py-2 text-left text-sm text-text outline-none transition-colors cursor-pointer hover:bg-border/40 focus:border-primary disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        {...rest}
      >
        <span className={`flex-1 truncate ${selected ? '' : 'text-muted'}`}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute left-0 top-full z-20 mt-1 min-w-full w-max max-w-xs max-h-56 overflow-y-auto rounded-lg border border-border bg-surface shadow-lg"
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              disabled={option.disabled}
              onClick={() => {
                onChange(option.value)
                setOpen(false)
              }}
              className={`flex w-full items-center whitespace-nowrap px-3 py-2 text-left text-sm cursor-pointer transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                option.value === value
                  ? 'bg-surface-raised text-text'
                  : 'text-muted hover:bg-surface-raised hover:text-text'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
