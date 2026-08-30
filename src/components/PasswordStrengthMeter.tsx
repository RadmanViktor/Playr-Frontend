import { useTranslation } from 'react-i18next'
import { getPasswordStrength, MINIMUM_PASSWORD_SCORE } from '../utils/validation'

const SEGMENT_COLORS = [
  'bg-frustrated',
  'bg-need-help',
  'bg-completed',
  'bg-enjoying',
] as const

const LABEL_COLORS = [
  'text-frustrated',
  'text-need-help',
  'text-completed',
  'text-enjoying',
] as const

const REQUIREMENT_KEYS: Array<[keyof ReturnType<typeof getPasswordStrength>['requirements'], string]> = [
  ['length', 'passwordStrengthMeter.requirementLength'],
  ['lowercase', 'passwordStrengthMeter.requirementLowercase'],
  ['uppercase', 'passwordStrengthMeter.requirementUppercase'],
  ['number', 'passwordStrengthMeter.requirementNumber'],
  ['symbol', 'passwordStrengthMeter.requirementSymbol'],
]

const STRENGTH_LABEL_KEYS = [
  'passwordStrengthMeter.strengthWeak',
  'passwordStrengthMeter.strengthFair',
  'passwordStrengthMeter.strengthGood',
  'passwordStrengthMeter.strengthStrong',
] as const

export function PasswordStrengthMeter({ password }: { password: string }) {
  const { t } = useTranslation('componentsB')
  const { score, requirements } = getPasswordStrength(password)
  const isAcceptable = score >= MINIMUM_PASSWORD_SCORE

  return (
    <div className="mt-1 flex flex-col gap-2">
      <div className="flex gap-1" aria-hidden="true">
        {[0, 1, 2, 3].map((segment) => (
          <div
            key={segment}
            data-testid={`strength-segment-${segment}`}
            className={`h-1 flex-1 rounded-full ${
              segment <= score ? SEGMENT_COLORS[score] : 'bg-border'
            }`}
          />
        ))}
      </div>

      <p role="status" aria-live="polite" className={`text-xs ${LABEL_COLORS[score]}`}>
        {t('passwordStrengthMeter.strengthLabel', { label: t(STRENGTH_LABEL_KEYS[score]) })}
        {!isAcceptable && t('passwordStrengthMeter.chooseStrongerPassword')}
      </p>

      <ul className="flex flex-col gap-0.5 text-xs text-muted">
        {REQUIREMENT_KEYS.map(([key, textKey]) => (
          <li key={key} className={requirements[key] ? 'text-enjoying' : undefined}>
            <span aria-hidden="true">{requirements[key] ? '\u2713' : '\u2022'}</span>{' '}
            <span>{t(textKey)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
