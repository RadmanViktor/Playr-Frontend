import { useTranslation } from 'react-i18next'
import { MAX_PREFERRED_AGE, MIN_PREFERRED_AGE } from '../utils/agePreference'

interface AgePreferenceFieldsProps {
  idPrefix: string
  minAge: string
  maxAge: string
  onMinAgeChange: (value: string) => void
  onMaxAgeChange: (value: string) => void
  error?: string | null
}

export function AgePreferenceFields({
  idPrefix,
  minAge,
  maxAge,
  onMinAgeChange,
  onMaxAgeChange,
  error,
}: AgePreferenceFieldsProps) {
  const { t } = useTranslation('componentsB')
  const errorId = `${idPrefix}-age-error`
  const inputClass =
    'w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-text outline-none placeholder:text-muted focus:border-primary'

  return (
    <fieldset>
      <legend className="text-xs font-medium text-muted">{t('agePreference.label')}</legend>
      <p className="mt-0.5 text-xs text-muted">{t('agePreference.description')}</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <label htmlFor={`${idPrefix}-min-age`} className="text-xs text-muted">
          {t('agePreference.minAge')}
          <input
            id={`${idPrefix}-min-age`}
            type="number"
            inputMode="numeric"
            min={MIN_PREFERRED_AGE}
            max={MAX_PREFERRED_AGE}
            value={minAge}
            onChange={(event) => onMinAgeChange(event.target.value)}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            placeholder={String(MIN_PREFERRED_AGE)}
            className={`mt-1 ${inputClass}`}
          />
        </label>
        <label htmlFor={`${idPrefix}-max-age`} className="text-xs text-muted">
          {t('agePreference.maxAge')}
          <input
            id={`${idPrefix}-max-age`}
            type="number"
            inputMode="numeric"
            min={MIN_PREFERRED_AGE}
            max={MAX_PREFERRED_AGE}
            value={maxAge}
            onChange={(event) => onMaxAgeChange(event.target.value)}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            placeholder={String(MAX_PREFERRED_AGE)}
            className={`mt-1 ${inputClass}`}
          />
        </label>
      </div>
      {error && <p id={errorId} role="alert" className="mt-2 text-sm text-frustrated">{error}</p>}
    </fieldset>
  )
}
