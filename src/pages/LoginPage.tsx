import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { TerminalFrame } from '../components/TerminalFrame'
import { useAuth } from '../context/AuthContext'
import { ApiError } from '../api/authApi'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [usernameOrEmail, setUsernameOrEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      await login(usernameOrEmail, password)
      navigate('/')
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Something went wrong.'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0e14] px-4">
      <TerminalFrame title="playr_auth --login">
        <h1 className="mb-6 text-lg">Welcome to Playr_</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            username or email
            <input
              id="usernameOrEmail"
              aria-label="username or email"
              className="border-b border-[#39ff14] bg-transparent px-1 py-1 text-[#39ff14] outline-none focus:shadow-[0_0_8px_#39ff14]"
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              required
            />
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
              required
            />
          </label>
          {error && <p className="text-orange-400">{`ERROR: ${error}`}</p>}
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
