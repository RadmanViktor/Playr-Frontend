import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import {
  ApiError,
  getMe,
  login as apiLogin,
  logoutSession,
  refreshSession,
  register as apiRegister,
  type UserResponse,
} from '../api/authApi'
import { getOnboardingStatus } from '../api/onboardingApi'
import {
  clearAccessToken,
  getAccessTokenExpiresAt,
  onSessionChanged,
  refreshAccessToken,
  setAccessToken,
} from '../api/session'

const TOKEN_STORAGE_KEY = 'playr_token'
const PENDING_LOGOUT_STORAGE_KEY = 'playr_pending_logout'

export interface AuthContextValue {
  user: UserResponse | null
  token: string | null
  isLoading: boolean
  hasCompletedOnboarding: boolean | null
  login: (usernameOrEmail: string, password: string) => Promise<void>
  register: (email: string, username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshOnboardingStatus: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null)
  const hasInitializedRef = useRef(false)
  const isAuthenticatingRef = useRef(false)
  const userId = user?.id

  useEffect(() => onSessionChanged((session) => {
    setToken(session?.accessToken ?? null)
    if (!session) {
      setUser(null)
      setHasCompletedOnboarding(null)
      return
    }

    if (userId === getTokenSubject(session.accessToken)) return
    setIsLoading(true)
    setUser(null)
    setHasCompletedOnboarding(null)
  }), [userId])

  useEffect(() => {
    let cancelled = false
    let retryTimeout: ReturnType<typeof setTimeout> | undefined
    const legacyToken = localStorage.getItem(TOKEN_STORAGE_KEY)
    localStorage.removeItem(TOKEN_STORAGE_KEY)

    async function initializeSession() {
      let shouldRetry = false
      try {
        if (localStorage.getItem(PENDING_LOGOUT_STORAGE_KEY)) {
          await logoutSession()
          localStorage.removeItem(PENDING_LOGOUT_STORAGE_KEY)
          return
        }
        const session = await refreshSession()
        if (cancelled) return
        await loadCurrentUser(session.accessToken)
      } catch (error) {
        if (cancelled) return
        if (legacyToken) {
          setAccessToken(legacyToken, getLegacyTokenExpiration(legacyToken))
          try {
            await loadCurrentUser(legacyToken)
            return
          } catch {
            // The legacy access token is no longer usable.
          }
        }
        if (!cancelled) {
          if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
            clearAccessToken()
          } else {
            shouldRetry = true
            retryTimeout = setTimeout(initializeSession, 5_000)
          }
          setUser(null)
          setHasCompletedOnboarding(null)
        }
      } finally {
        if (!cancelled && !shouldRetry) {
          hasInitializedRef.current = true
          setIsLoading(false)
        }
      }
    }

    async function loadCurrentUser(accessToken: string) {
      const currentUser = await getMe(accessToken)
      if (!cancelled) setUser(currentUser)
      try {
        const status = await getOnboardingStatus(accessToken)
        if (!cancelled) setHasCompletedOnboarding(status.hasCompletedOnboarding)
      } catch {
        if (!cancelled) setHasCompletedOnboarding(true)
      }
    }

    initializeSession()

    return () => {
      cancelled = true
      if (retryTimeout) clearTimeout(retryTimeout)
    }
  }, [])

  useEffect(() => {
    if (!token) return
    let timeoutId: ReturnType<typeof setTimeout> | undefined
    let cancelled = false

    function scheduleRefresh() {
      const expiresAt = Date.parse(getAccessTokenExpiresAt() ?? '')
      const delay = Number.isFinite(expiresAt)
        ? Math.max(0, expiresAt - Date.now() - 60_000)
        : 10 * 60_000
      timeoutId = setTimeout(async () => {
        try {
          await refreshAccessToken()
        } catch (error) {
          if (!cancelled && error instanceof ApiError && (error.status === 401 || error.status === 403)) {
            setUser(null)
            setHasCompletedOnboarding(null)
          }
        }
      }, Math.min(delay, 2_147_483_647))
    }

    scheduleRefresh()
    return () => {
      cancelled = true
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [token])

  useEffect(() => {
    if (!token || user || !hasInitializedRef.current || isAuthenticatingRef.current) return
    let cancelled = false

    async function restoreUserFromSharedSession() {
      try {
        const currentUser = await getMe(token!)
        const status = await getOnboardingStatus(token!).catch(() => ({ hasCompletedOnboarding: true }))
        if (!cancelled) {
          setUser(currentUser)
          setHasCompletedOnboarding(status.hasCompletedOnboarding)
        }
      } catch (error) {
        if (!cancelled && error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          clearAccessToken()
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    restoreUserFromSharedSession()
    return () => {
      cancelled = true
    }
  }, [token, user])

  const login = useCallback(async (usernameOrEmail: string, password: string) => {
    const result = await apiLogin(usernameOrEmail, password)
    localStorage.removeItem(PENDING_LOGOUT_STORAGE_KEY)
    isAuthenticatingRef.current = true
    setIsLoading(true)
    setAccessToken(result.accessToken, result.expiresAt)
    try {
      const currentUser = await getMe(result.accessToken)
      const status = await getOnboardingStatus(result.accessToken).catch(() => ({ hasCompletedOnboarding: true }))
      setUser(currentUser)
      setHasCompletedOnboarding(status.hasCompletedOnboarding)
    } finally {
      isAuthenticatingRef.current = false
      setIsLoading(false)
    }
  }, [])

  const register = useCallback(async (email: string, username: string, password: string) => {
    // No auto-login: the account cannot be used until the emailed link is followed.
    await apiRegister(email, username, password)
  }, [])

  const logout = useCallback(async () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    localStorage.setItem(PENDING_LOGOUT_STORAGE_KEY, '1')
    clearAccessToken()
    setUser(null)
    setHasCompletedOnboarding(null)
    try {
      await logoutSession()
      localStorage.removeItem(PENDING_LOGOUT_STORAGE_KEY)
    } catch {
      // Keep the pending marker so the cookie is revoked before the next restore.
    }
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

function getLegacyTokenExpiration(token: string): string {
  try {
    const payload = token.split('.')[1]
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const expiresAt = JSON.parse(atob(normalized))?.exp
    if (typeof expiresAt === 'number') return new Date(expiresAt * 1000).toISOString()
  } catch {
    // Keep opaque legacy tokens usable for one final access-token lifetime.
  }
  return new Date(Date.now() + 60 * 60_000).toISOString()
}

function getTokenSubject(token: string): string | null {
  try {
    const payload = token.split('.')[1]
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const subject = JSON.parse(atob(normalized))?.sub
    return typeof subject === 'string' ? subject : null
  } catch {
    return null
  }
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
