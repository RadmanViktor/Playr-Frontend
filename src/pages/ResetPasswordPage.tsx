import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { AuthPanel } from '../components/AuthPanel'
import { PasswordStrengthMeter } from '../components/PasswordStrengthMeter'
import { Button } from '../components/ui/Button'
import { ApiError, resetPassword } from '../api/authApi'
import {
  getPasswordStrength,
  MINIMUM_PASSWORD_SCORE,
  validatePassword,
  validatePasswordConfirmation,
} from '../utils/validation'

interface FieldErrors {
  password?: string
  confirmPassword?: string
}

const inputClass =
  'rounded-lg border border-border bg-surface-raised px-3 py-2 text-text outline-none focus:border-primary'

export default function ResetPasswordPage() {
  const { t } = useTranslation('pagesB')
  const [searchParams] = useSearchParams()
  const userId = searchParams.get('userId')
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [generalError, setGeneralError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isReset, setIsReset] = useState(false)

  function validate(): FieldErrors {
    const errors: FieldErrors = {}
    const passwordError = validatePassword(password)
    const confirmError = validatePasswordConfirmation(password, confirmPassword)

    if (passwordError) {
      errors.password = passwordError
    } else if (getPasswordStrength(password).score < MINIMUM_PASSWORD_SCORE) {
      errors.password = t('resetPassword.errors.passwordTooWeak')
    }

    if (confirmError) errors.confirmPassword = confirmError
    return errors
  }

  function clearError(field: keyof FieldErrors) {
    setFieldErrors((current) => {
      if (!current[field]) return current
      const next = { ...current }
      delete next[field]
      return next
    })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setGeneralError(null)

    if (!userId || !token) {
      setGeneralError(t('resetPassword.errors.incompleteLink'))
      return
    }

    const errors = validate()
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) {
      return
    }

    setIsSubmitting(true)
    try {
      await resetPassword(userId, token, password)
      setIsReset(true)
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : t('resetPassword.errors.generic')
      setGeneralError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isReset) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg px-4">
        <AuthPanel title={t('resetPassword.title')}>
          <p role="status" className="text-center text-sm text-enjoying">
            {t('resetPassword.success')}
          </p>
          <p className="mt-6 text-center text-sm text-muted">
            <Link to="/login" className="text-primary hover:underline">
              {t('resetPassword.goToLogin')}
            </Link>
          </p>
        </AuthPanel>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg px-4">
      <AuthPanel title={t('resetPassword.title')}>
        {!userId || !token ? (
          <p role="status" className="text-sm text-frustrated">
            {t('resetPassword.errors.incompleteLink')}
          </p>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <label className="flex flex-col gap-1 text-sm text-muted">
              {t('resetPassword.passwordLabel')}
              <div className="relative">
                <input
                  id="password"
                  aria-label={t('resetPassword.passwordAriaLabel')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className={`${inputClass} w-full pr-10`}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    clearError('password')
                    clearError('confirmPassword')
                  }}
                />
                <button
                  type="button"
                  aria-label={
                    showPassword ? t('resetPassword.hidePassword') : t('resetPassword.showPassword')
                  }
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-text"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {password && <PasswordStrengthMeter password={password} />}
              {fieldErrors.password && (
                <span className="text-frustrated">{fieldErrors.password}</span>
              )}
            </label>

            <label className="flex flex-col gap-1 text-sm text-muted">
              {t('resetPassword.confirmPasswordLabel')}
              <input
                id="confirmPassword"
                aria-label={t('resetPassword.confirmPasswordAriaLabel')}
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                className={inputClass}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  clearError('confirmPassword')
                }}
              />
              {fieldErrors.confirmPassword && (
                <span className="text-frustrated">{fieldErrors.confirmPassword}</span>
              )}
            </label>

            {generalError && <p className="text-frustrated">{generalError}</p>}
            <Button type="submit" disabled={isSubmitting} className="mt-2 w-full">
              {t('resetPassword.submit')}
            </Button>
          </form>
        )}
        <p className="mt-6 text-sm text-muted">
          <Link to="/login" className="text-primary hover:underline">
            {t('resetPassword.goToLogin')}
          </Link>
        </p>
      </AuthPanel>
    </div>
  )
}
