import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AuthPanel } from '../components/AuthPanel'
import { AuthShell } from '../components/AuthShell'
import { LoginLiveLobby } from '../components/LoginLiveLobby'
import { Button } from '../components/ui/Button'
import { useAuth } from '../context/AuthContext'
import { ApiError, resendConfirmation } from '../api/authApi'

interface FieldErrors {
  usernameOrEmail?: string
  password?: string
}

const inputClass =
  'auth-input'

export default function LoginPage() {
  const { t } = useTranslation('pagesB')
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
      errors.usernameOrEmail = t('login.errors.usernameOrEmailRequired')
    }
    if (!password) {
      errors.password = t('login.errors.passwordRequired')
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
      navigate('/feed')
    } catch (err) {
      // 403 means the credentials were correct but the email is still unconfirmed.
      if (err instanceof ApiError && err.status === 403) {
        setNeedsConfirmation(true)
        setGeneralError(err.message)
      } else {
        const message = err instanceof ApiError ? err.message : t('login.errors.generic')
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
      setGeneralError(t('login.errors.resendFailed'))
    }
  }

  return (
    <AuthShell showcase={<LoginLiveLobby />}>
      <AuthPanel
        eyebrow={t('login.eyebrow')}
        title={t('login.title')}
        description={t('login.description')}
      >
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm text-muted">
            {t('login.usernameOrEmailLabel')}
            <input
              id="usernameOrEmail"
              aria-label={t('login.usernameOrEmailAriaLabel')}
              autoComplete="username"
              className={inputClass}
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
            />
            {fieldErrors.usernameOrEmail && (
              <span className="text-frustrated">{fieldErrors.usernameOrEmail}</span>
            )}
          </label>
          <label className="flex flex-col gap-1 text-sm text-muted">
            {t('login.passwordLabel')}
            <input
              id="password"
              aria-label={t('login.passwordAriaLabel')}
              type="password"
              autoComplete="current-password"
              className={inputClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {fieldErrors.password && (
              <span className="text-frustrated">{fieldErrors.password}</span>
            )}
          </label>
          <p className="-mt-2 text-right text-sm">
            <Link to="/forgot-password" className="text-primary hover:underline">
              {t('login.forgotPassword')}
            </Link>
          </p>
          {generalError && <p className="text-frustrated">{generalError}</p>}
          {needsConfirmation &&
            (resendState === 'sent' ? (
              <p className="text-sm text-enjoying" role="status">
                {t('login.confirmationEmailSent')}
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
                  ? t('login.resendConfirmationEmail')
                  : t('login.enterEmailToResend')}
              </Button>
            ))}
          <Button type="submit" disabled={isSubmitting} className="mt-2 w-full">
            {t('login.submit')}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted">
          {t('login.registerPrompt')}{' '}
          <Link to="/register" className="text-primary hover:underline">
            {t('login.registerInstead')}
          </Link>
        </p>
      </AuthPanel>
    </AuthShell>
  )
}
