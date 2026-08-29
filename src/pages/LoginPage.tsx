import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthPanel } from '../components/AuthPanel'
import { Button } from '../components/ui/Button'
import { useAuth } from '../context/AuthContext'
import { ApiError, resendConfirmation } from '../api/authApi'

interface FieldErrors {
  usernameOrEmail?: string
  password?: string
}

const inputClass =
  'rounded-lg border border-border bg-surface-raised px-3 py-2 text-text outline-none focus:border-primary'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [usernameOrEmail, setUsernameOrEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [generalError, setGeneralError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [needsConfirmation, setNeedsConfirmation] = useState(false)
  const [resendState, setResendState] = useState<'idle' | 'sending' | 'sent'>('idle')

  function validate(): FieldErrors {
    const errors: FieldErrors = {}
    if (!usernameOrEmail.trim()) {
      errors.usernameOrEmail = 'username or email is required'
    }
    if (!password) {
      errors.password = 'password is required'
    }
    return errors
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setGeneralError(null)
    setNeedsConfirmation(false)

    const errors = validate()
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) {
      return
    }

    setIsSubmitting(true)
    try {
      await login(usernameOrEmail, password)
      navigate('/')
    } catch (err) {
      // 403 means the credentials were correct but the email is still unconfirmed.
      if (err instanceof ApiError && err.status === 403) {
        setNeedsConfirmation(true)
        setGeneralError(err.message)
      } else {
        const message = err instanceof ApiError ? err.message : 'Something went wrong.'
        setGeneralError(message)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleResend() {
    setResendState('sending')
    try {
      await resendConfirmation(usernameOrEmail.trim())
      setResendState('sent')
    } catch {
      setResendState('idle')
      setGeneralError('Could not send the confirmation email. Please try again.')
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg px-4">
      <AuthPanel title="Log in to PLAYR">
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm text-muted">
            Username or email
            <input
              id="usernameOrEmail"
              aria-label="username or email"
              className={inputClass}
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
            />
            {fieldErrors.usernameOrEmail && (
              <span className="text-frustrated">{fieldErrors.usernameOrEmail}</span>
            )}
          </label>
          <label className="flex flex-col gap-1 text-sm text-muted">
            Password
            <input
              id="password"
              aria-label="password"
              type="password"
              className={inputClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {fieldErrors.password && (
              <span className="text-frustrated">{fieldErrors.password}</span>
            )}
          </label>
          {generalError && <p className="text-frustrated">{generalError}</p>}
          {needsConfirmation &&
            (resendState === 'sent' ? (
              <p className="text-sm text-enjoying" role="status">
                Confirmation email sent. Check your inbox.
              </p>
            ) : (
              <Button
                type="button"
                variant="secondary"
                onClick={handleResend}
                disabled={resendState === 'sending' || !usernameOrEmail.includes('@')}
                className="w-full"
              >
                {usernameOrEmail.includes('@')
                  ? 'Resend confirmation email'
                  : 'Enter your email above to resend'}
              </Button>
            ))}
          <Button type="submit" disabled={isSubmitting} className="mt-2 w-full">
            Log In
          </Button>
        </form>
        <p className="mt-6 text-sm text-muted">
          <Link to="/register" className="text-primary hover:underline">
            Register instead
          </Link>
        </p>
      </AuthPanel>
    </div>
  )
}
