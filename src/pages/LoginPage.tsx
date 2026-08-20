import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { TerminalFrame } from '../components/TerminalFrame'
import { useAuth } from '../context/AuthContext'
import { ApiError } from '../api/authApi'

interface FieldErrors {
  usernameOrEmail?: string
  password?: string
}

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [usernameOrEmail, setUsernameOrEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [generalError, setGeneralError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

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
      const message = err instanceof ApiError ? err.message : 'Something went wrong.'
      setGeneralError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0e14] px-4">
      <TerminalFrame title="playr_auth --login">
        <h1 className="mb-6 text-lg">Welcome to Playr_</h1>
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            username or email
            <input
              id="usernameOrEmail"
              aria-label="username or email"
              className="border-b border-[#39ff14] bg-transparent px-1 py-1 text-[#39ff14] outline-none focus:shadow-[0_0_8px_#39ff14]"
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
            />
            {fieldErrors.usernameOrEmail && (
              <span className="text-orange-400">{`ERROR: ${fieldErrors.usernameOrEmail}`}</span>
            )}
          </label>
          <label className="flex flex-col gap-1 text-sm">
            password
            <input
              id="password"
              aria-label="password"
              type="password"
              className="border-b border-[#39ff14] bg-transparent px-1 py-1 text-[#39ff14] outline-none focus:shadow-[0_0_8px_#39ff14]"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {fieldErrors.password && (
              <span className="text-orange-400">{`ERROR: ${fieldErrors.password}`}</span>
            )}
          </label>
          {generalError && <p className="text-orange-400">{`ERROR: ${generalError}`}</p>}
          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 border border-[#39ff14] px-4 py-2 uppercase tracking-wide hover:shadow-[0_0_8px_#39ff14] disabled:opacity-50"
          >
            [ Log In ]
          </button>
        </form>
        <p className="mt-6 text-sm">
          <Link to="/register" className="underline">
            {'> register instead'}
          </Link>
        </p>
      </TerminalFrame>
    </div>
  )
}
