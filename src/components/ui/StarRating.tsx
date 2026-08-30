import { Star } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface StarRatingProps {
  value: number
  onChange?: (value: number) => void
  size?: number
}

export function StarRating({ value, onChange, size = 18 }: StarRatingProps) {
  const { t } = useTranslation('ui')
  const interactive = !!onChange

  return (
    <div className="flex items-center gap-0.5" role={interactive ? 'radiogroup' : undefined} aria-label={t('starRating.ariaLabel')}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          aria-label={t('starRating.starLabel', { count: star })}
          aria-pressed={interactive ? star <= value : undefined}
          onClick={() => onChange?.(star)}
          className={interactive ? 'cursor-pointer' : 'cursor-default'}
        >
          <Star
            width={size}
            height={size}
            className={star <= value ? 'fill-need-help text-need-help' : 'fill-none text-muted'}
          />
        </button>
      ))}
    </div>
  )
}
