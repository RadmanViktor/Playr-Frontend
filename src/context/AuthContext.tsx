import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { getMe, login as apiLogin, register as apiRegister, type UserResponse } from '../api/authApi'

const TOKEN_STORAGE_KEY = 'playr_token'

export interface AuthContextValue {
  user: UserResponse | null
  token: string | null
  isLoading: boolean
  login: (usernameOrEmail: string, password: string) => Promise<void>
  register: (email: string, username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null)
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_STORAGE_KEY))
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadUser() {
      if (!token) {
        setUser(null)
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        const currentUser = await getMe(token)
        if (!cancelled) {
          setUser(currentUser)
        }
      } catch {
        if (!cancelled) {
          localStorage.removeItem(TOKEN_STORAGE_KEY)
          setToken(null)
          setUser(null)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    loadUser()

    return () => {
      cancelled = true
    }
  }, [token])

  const login = useCallback(async (usernameOrEmail: string, password: string) => {
    const result = await apiLogin(usernameOrEmail, password)
    localStorage.setItem(TOKEN_STORAGE_KEY, result.accessToken)
    setToken(result.accessToken)
  }, [])

  const register = useCallback(async (email: string, username: string, password: string) => {
    // No auto-login: the account cannot be used until the emailed link is followed.
    await apiRegister(email, username, password)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
