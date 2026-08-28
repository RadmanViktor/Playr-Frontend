import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthPanel } from '../components/AuthPanel'
import { Button } from '../components/ui/Button'
import { useAuth } from '../context/AuthContext'
import { ApiError } from '../api/authApi'
import { validateEmail, validatePassword, validateUsername } from '../utils/validation'

interface FieldErrors {
  email?: string
  username?: string
  password?: string
}

const inputClass =
  'rounded-lg border border-border bg-surface-raised px-3 py-2 text-text outline-none focus:border-primary'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [generalError, setGeneralError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function validate(): FieldErrors {
    const errors: FieldErrors = {}
    const emailError = validateEmail(email)
    const usernameError = validateUsername(username)
    const passwordError = validatePassword(password)
    if (emailError) errors.email = emailError
    if (usernameError) errors.username = usernameError
    if (passwordError) errors.password = passwordError
    return errors
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
      navigate('/')
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Something went wrong.'
      setGeneralError(message)
    } finally {
      setIsSubmitting(false)
    }
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
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {fieldErrors.email && <span className="text-frustrated">{fieldErrors.email}</span>}
          </label>
          <label className="flex flex-col gap-1 text-sm text-muted">
            Username
            <input
              id="username"
              aria-label="username"
              className={inputClass}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            {fieldErrors.username && (
              <span className="text-frustrated">{fieldErrors.username}</span>
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
