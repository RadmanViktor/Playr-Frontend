import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { AuthPanel } from '../components/AuthPanel'
import { AuthShell } from '../components/AuthShell'
import { PasswordStrengthMeter } from '../components/PasswordStrengthMeter'
import { Button } from '../components/ui/Button'
import { useAuth } from '../context/AuthContext'
import { ApiError, resendConfirmation } from '../api/authApi'
import {
  getPasswordStrength,
  MINIMUM_PASSWORD_SCORE,
  validateEmail,
  validatePassword,
  validatePasswordConfirmation,
  validateUsername,
} from '../utils/validation'

interface FieldErrors {
  email?: string
  username?: string
  password?: string
  confirmPassword?: string
}

const inputClass =
  'auth-input'

const RESEND_COOLDOWN_SECONDS = 30

export default function RegisterPage() {
  const { t } = useTranslation('pagesB')
  const { register } = useAuth()
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [generalError, setGeneralError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null)
  const [resendState, setResendState] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [resendCooldown, setResendCooldown] = useState(0)

  function validate(): FieldErrors {
    const errors: FieldErrors = {}
    const emailError = validateEmail(email)
    const usernameError = validateUsername(username)
    const passwordError = validatePassword(password)
    const confirmError = validatePasswordConfirmation(password, confirmPassword)

    if (emailError) errors.email = emailError
    if (usernameError) errors.username = usernameError

    if (passwordError) {
      errors.password = passwordError
    } else if (getPasswordStrength(password).score < MINIMUM_PASSWORD_SCORE) {
      errors.password = t('register.errors.passwordTooWeak')
    }

    if (confirmError) errors.confirmPassword = confirmError
    return errors
  }

  /** Clears a field's error as soon as the user starts correcting it. */
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

    const errors = validate()
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) {
      return
    }

    setIsSubmitting(true)
    try {
      await register(email, username, password)
      setRegisteredEmail(email)
    } catch (err) {
      const message = err instanceof ApiError ? err.message : t('register.errors.generic')
      setGeneralError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleResend() {
    if (!registeredEmail || resendCooldown > 0) return

    setResendState('sending')
    try {
      await resendConfirmation(registeredEmail)
      setResendState('sent')
      setResendCooldown(RESEND_COOLDOWN_SECONDS)
      const interval = setInterval(() => {
        setResendCooldown((seconds) => {
          if (seconds <= 1) {
            clearInterval(interval)
            return 0
          }
          return seconds - 1
        })
      }, 1000)
    } catch {
      setResendState('idle')
      setGeneralError(t('register.errors.resendFailed'))
    }
  }

  if (registeredEmail) {
    return (
      <AuthShell>
        <AuthPanel title={t('register.checkYourEmail.title')}>
          <p className="text-sm text-muted">
            {t('register.checkYourEmail.sentTo')}{' '}
            <span className="text-text">{registeredEmail}</span>
            {t('register.checkYourEmail.instructions')}
          </p>
          <p className="mt-4 text-sm text-muted">
            {t('register.checkYourEmail.checkSpam')}
          </p>
          {resendState === 'sent' && (
            <p className="mt-4 text-sm text-enjoying" role="status">
              {t('register.checkYourEmail.emailSent')}
            </p>
          )}
          {generalError && <p className="mt-4 text-frustrated">{generalError}</p>}
          <Button
            type="button"
            variant="secondary"
            onClick={handleResend}
            disabled={resendState === 'sending' || resendCooldown > 0}
            className="mt-4 w-full"
          >
            {resendCooldown > 0 ? t('register.checkYourEmail.resendEmailCooldown', { seconds: resendCooldown }) : t('register.checkYourEmail.resendEmail')}
          </Button>
          <p className="mt-6 text-sm text-muted">
            <Link to="/login" className="text-primary hover:underline">
              {t('register.checkYourEmail.goToLogin')}
            </Link>
          </p>
        </AuthPanel>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <AuthPanel title={t('register.title')}>
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm text-muted">
            {t('register.emailLabel')}
            <input
              id="email"
              aria-label={t('register.emailAriaLabel')}
              type="email"
              autoComplete="email"
              className={inputClass}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                clearError('email')
              }}
              onBlur={() => {
                const error = validateEmail(email)
                if (error) setFieldErrors((current) => ({ ...current, email: error }))
              }}
            />
            {fieldErrors.email && <span className="text-frustrated">{fieldErrors.email}</span>}
          </label>

          <label className="flex flex-col gap-1 text-sm text-muted">
            {t('register.usernameLabel')}
            <input
              id="username"
              aria-label={t('register.usernameAriaLabel')}
              autoComplete="username"
              className={inputClass}
              value={username}
              onChange={(e) => {
                setUsername(e.target.value)
                clearError('username')
              }}
              onBlur={() => {
                const error = validateUsername(username)
                if (error) setFieldErrors((current) => ({ ...current, username: error }))
              }}
            />
            {fieldErrors.username && (
              <span className="text-frustrated">{fieldErrors.username}</span>
            )}
          </label>

          <label className="flex flex-col gap-1 text-sm text-muted">
            {t('register.passwordLabel')}
            <div className="relative">
              <input
                id="password"
                aria-label={t('register.passwordAriaLabel')}
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
                aria-label={showPassword ? t('register.hidePassword') : t('register.showPassword')}
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
            {t('register.confirmPasswordLabel')}
            <input
              id="confirmPassword"
              aria-label={t('register.confirmPasswordAriaLabel')}
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              className={inputClass}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value)
                clearError('confirmPassword')
              }}
              onBlur={() => {
                const error = validatePasswordConfirmation(password, confirmPassword)
                if (error) {
                  setFieldErrors((current) => ({ ...current, confirmPassword: error }))
                }
              }}
            />
            {fieldErrors.confirmPassword && (
              <span className="text-frustrated">{fieldErrors.confirmPassword}</span>
            )}
          </label>

          {generalError && <p className="text-frustrated">{generalError}</p>}
          <Button type="submit" disabled={isSubmitting} className="mt-2 w-full">
            {t('register.submit')}
          </Button>
        </form>
        <p className="mt-6 text-sm text-muted">
          <Link to="/login" className="text-primary hover:underline">
            {t('register.loginInstead')}
          </Link>
        </p>
      </AuthPanel>
    </AuthShell>
  )
}
