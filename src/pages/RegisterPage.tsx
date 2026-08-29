import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { AuthPanel } from '../components/AuthPanel'
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
  'rounded-lg border border-border bg-surface-raised px-3 py-2 text-text outline-none focus:border-primary'

const RESEND_COOLDOWN_SECONDS = 30

export default function RegisterPage() {
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
      errors.password = 'password is too weak'
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
      const message = err instanceof ApiError ? err.message : 'Something went wrong.'
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
      setGeneralError('Could not send the confirmation email. Please try again.')
    }
  }

  if (registeredEmail) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg px-4">
        <AuthPanel title="Check your email">
          <p className="text-sm text-muted">
            We sent a confirmation link to{' '}
            <span className="text-text">{registeredEmail}</span>. Click it to activate your
            account, then log in.
          </p>
          <p className="mt-4 text-sm text-muted">
            Nothing in your inbox? Check your spam folder first.
          </p>
          {resendState === 'sent' && (
            <p className="mt-4 text-sm text-enjoying" role="status">
              Confirmation email sent.
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
            {resendCooldown > 0 ? `Resend email (${resendCooldown}s)` : 'Resend email'}
          </Button>
          <p className="mt-6 text-sm text-muted">
            <Link to="/login" className="text-primary hover:underline">
              Go to login
            </Link>
          </p>
        </AuthPanel>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg px-4">
      <AuthPanel title="Create your PLAYR account">
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm text-muted">
            Email
            <input
              id="email"
              aria-label="email"
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
            Username
            <input
              id="username"
              aria-label="username"
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
            Password
            <div className="relative">
              <input
                id="password"
                aria-label="password"
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
                aria-label={showPassword ? 'hide password' : 'show password'}
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
            Confirm password
            <input
              id="confirmPassword"
              aria-label="confirm password"
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
            Register
          </Button>
        </form>
        <p className="mt-6 text-sm text-muted">
          <Link to="/login" className="text-primary hover:underline">
            Login instead
          </Link>
        </p>
      </AuthPanel>
    </div>
  )
}
