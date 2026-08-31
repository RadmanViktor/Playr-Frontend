import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { getMe, login as apiLogin, register as apiRegister, type UserResponse } from '../api/authApi'
import { getOnboardingStatus } from '../api/onboardingApi'

const TOKEN_STORAGE_KEY = 'playr_token'

export interface AuthContextValue {
  user: UserResponse | null
  token: string | null
  isLoading: boolean
  hasCompletedOnboarding: boolean | null
  login: (usernameOrEmail: string, password: string) => Promise<void>
  register: (email: string, username: string, password: string) => Promise<void>
  logout: () => void
  refreshOnboardingStatus: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null)
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_STORAGE_KEY))
  const [isLoading, setIsLoading] = useState(true)
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadUser() {
      if (!token) {
        setUser(null)
        setHasCompletedOnboarding(null)
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        const currentUser = await getMe(token)
        if (!cancelled) {
          setUser(currentUser)
        }
        try {
          const status = await getOnboardingStatus(token)
          if (!cancelled) {
            setHasCompletedOnboarding(status.hasCompletedOnboarding)
          }
        } catch {
          if (!cancelled) {
            setHasCompletedOnboarding(true)
          }
        }
      } catch {
        if (!cancelled) {
          localStorage.removeItem(TOKEN_STORAGE_KEY)
          setToken(null)
          setUser(null)
          setHasCompletedOnboarding(null)
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
    setHasCompletedOnboarding(null)
  }, [])

  const refreshOnboardingStatus = useCallback(async () => {
    if (!token) return
    try {
      const status = await getOnboardingStatus(token)
      setHasCompletedOnboarding(status.hasCompletedOnboarding)
    } catch {
      // Leave the current value in place; the user can retry from the onboarding page.
    }
  }, [token])

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, hasCompletedOnboarding, login, register, logout, refreshOnboardingStatus }}
    >
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
