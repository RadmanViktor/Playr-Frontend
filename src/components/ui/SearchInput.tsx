import type { InputHTMLAttributes } from 'react'
import { Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function SearchInput({
  className = '',
  placeholder,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  const { t } = useTranslation('ui')
  const resolvedPlaceholder = placeholder ?? t('searchInput.placeholder')
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-raised px-3 py-2">
      <Search className="h-4 w-4 text-muted" aria-hidden="true" />
      <input
        type="search"
        aria-label={t('searchInput.ariaLabel')}
        placeholder={resolvedPlaceholder}
        className={`w-full bg-transparent text-sm text-text outline-none placeholder:text-muted ${className}`}
        {...props}
      />
    </div>
  )
}
