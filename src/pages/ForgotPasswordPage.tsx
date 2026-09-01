import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AuthPanel } from '../components/AuthPanel'
import { Button } from '../components/ui/Button'
import { forgotPassword } from '../api/authApi'
import { validateEmail } from '../utils/validation'

const inputClass =
  'rounded-lg border border-border bg-surface-raised px-3 py-2 text-text outline-none focus:border-primary'

export default function ForgotPasswordPage() {
  const { t } = useTranslation('pagesB')
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const error = validateEmail(email)
    setEmailError(error)
    if (error) return

    setIsSubmitting(true)
    try {
      await forgotPassword(email.trim())
    } catch {
      // Intentionally ignored: the confirmation message is shown regardless of
      // whether the request succeeded, so the endpoint cannot be used to
      // enumerate accounts.
    } finally {
      setIsSubmitting(false)
      setSent(true)
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg px-4">
      <AuthPanel title={t('forgotPassword.title')}>
        {sent ? (
          <p role="status" className="text-center text-sm text-enjoying">
            {t('forgotPassword.sent')}
          </p>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <p className="text-sm text-muted">{t('forgotPassword.description')}</p>
            <label className="flex flex-col gap-1 text-sm text-muted">
              {t('forgotPassword.emailLabel')}
              <input
                id="email"
                aria-label={t('forgotPassword.emailAriaLabel')}
                type="email"
                autoComplete="email"
                className={inputClass}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setEmailError(null)
                }}
              />
              {emailError && <span className="text-frustrated">{emailError}</span>}
            </label>
            <Button type="submit" disabled={isSubmitting} className="mt-2 w-full">
              {t('forgotPassword.submit')}
            </Button>
          </form>
        )}
        <p className="mt-6 text-center text-sm text-muted">
          <Link to="/login" className="text-primary hover:underline">
            {t('forgotPassword.goToLogin')}
          </Link>
        </p>
      </AuthPanel>
    </div>
  )
}
