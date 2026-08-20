import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { TerminalFrame } from '../components/TerminalFrame'
import { useAuth } from '../context/AuthContext'
import { ApiError } from '../api/authApi'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      await register(email, username, password)
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
      <TerminalFrame title="playr_auth --register">
        <h1 className="mb-6 text-lg">Create your account_</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            email
            <input
              id="email"
              aria-label="email"
              type="email"
              className="border-b border-[#39ff14] bg-transparent px-1 py-1 text-[#39ff14] outline-none focus:shadow-[0_0_8px_#39ff14]"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            username
            <input
              id="username"
              aria-label="username"
              className="border-b border-[#39ff14] bg-transparent px-1 py-1 text-[#39ff14] outline-none focus:shadow-[0_0_8px_#39ff14]"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
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
            [ Register ]
          </button>
        </form>
        <p className="mt-6 text-sm">
          <Link to="/login" className="underline">
            {'> login instead'}
          </Link>
        </p>
      </TerminalFrame>
    </div>
  )
}
