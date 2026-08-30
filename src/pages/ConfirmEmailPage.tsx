import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AuthPanel } from '../components/AuthPanel'
import { Button } from '../components/ui/Button'
import { ApiError, confirmEmail, resendConfirmation } from '../api/authApi'

type Status = 'confirming' | 'confirmed' | 'failed'

export default function ConfirmEmailPage() {
  const { t } = useTranslation('pagesB')
  const [searchParams] = useSearchParams()
  const userId = searchParams.get('userId')
  const token = searchParams.get('token')

  const [status, setStatus] = useState<Status>('confirming')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [resendState, setResendState] = useState<'idle' | 'sending' | 'sent'>('idle')

  // React StrictMode mounts effects twice in development. Confirmation tokens are
  // single-use, so a second call would report a spurious failure.
  const hasRequested = useRef(false)

  useEffect(() => {
    if (hasRequested.current) return
    hasRequested.current = true

    if (!userId || !token) {
      setStatus('failed')
      setErrorMessage(t('confirmEmail.errors.incompleteLink'))
      return
    }

    let cancelled = false

    confirmEmail(userId, token)
      .then(() => {
        if (!cancelled) setStatus('confirmed')
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setStatus('failed')
        setErrorMessage(
          err instanceof ApiError ? err.message : t('confirmEmail.errors.invalidOrExpired')
        )
      })

    return () => {
      cancelled = true
    }
  }, [userId, token])

  async function handleResend() {
    if (!email.trim()) return

    setResendState('sending')
    try {
      await resendConfirmation(email.trim())
      setResendState('sent')
    } catch {
      setResendState('idle')
      setErrorMessage(t('confirmEmail.errors.resendFailed'))
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg px-4">
      <AuthPanel title={t('confirmEmail.title')}>
        {status === 'confirming' && (
          <p role="status" className="text-sm text-muted">
            {t('confirmEmail.confirming')}
          </p>
        )}

        {status === 'confirmed' && (
          <>
            <p role="status" className="text-sm text-enjoying">
              {t('confirmEmail.confirmed')}
            </p>
            <p className="mt-6 text-sm text-muted">
              <Link to="/login" className="text-primary hover:underline">
                {t('confirmEmail.goToLogin')}
              </Link>
            </p>
          </>
        )}

        {status === 'failed' && (
          <>
            <p role="status" className="text-sm text-frustrated">
              {errorMessage}
            </p>
            {resendState === 'sent' ? (
              <p className="mt-4 text-sm text-enjoying">
                {t('confirmEmail.resendSent')}
              </p>
            ) : (
              <div className="mt-4 flex flex-col gap-2">
                <label className="flex flex-col gap-1 text-sm text-muted">
                  {t('confirmEmail.enterEmailLabel')}
                  <input
                    aria-label={t('confirmEmail.emailAriaLabel')}
                    type="email"
                    autoComplete="email"
                    className="rounded-lg border border-border bg-surface-raised px-3 py-2 text-text outline-none focus:border-primary"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </label>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleResend}
                  disabled={resendState === 'sending' || !email.trim()}
                  className="w-full"
                >
                  {t('confirmEmail.sendNewLink')}
                </Button>
              </div>
            )}
            <p className="mt-6 text-sm text-muted">
              <Link to="/login" className="text-primary hover:underline">
                {t('confirmEmail.goToLogin')}
              </Link>
            </p>
          </>
        )}
      </AuthPanel>
    </div>
  )
}
