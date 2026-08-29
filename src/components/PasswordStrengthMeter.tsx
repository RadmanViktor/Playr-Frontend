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

const REQUIREMENT_LABELS: Array<[keyof ReturnType<typeof getPasswordStrength>['requirements'], string]> = [
  ['length', 'at least 8 characters'],
  ['lowercase', 'a lowercase letter'],
  ['uppercase', 'an uppercase letter'],
  ['number', 'a number'],
  ['symbol', 'a symbol (optional, adds strength)'],
]

export function PasswordStrengthMeter({ password }: { password: string }) {
  const { score, label, requirements } = getPasswordStrength(password)
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
        Password strength: {label}
        {!isAcceptable && ' - please choose a stronger password'}
      </p>

      <ul className="flex flex-col gap-0.5 text-xs text-muted">
        {REQUIREMENT_LABELS.map(([key, text]) => (
          <li key={key} className={requirements[key] ? 'text-enjoying' : undefined}>
            <span aria-hidden="true">{requirements[key] ? '\u2713' : '\u2022'}</span>{' '}
            <span>{text}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
