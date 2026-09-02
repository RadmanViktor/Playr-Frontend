import { API_BASE_URL, ApiError, parseErrorMessage } from './http'

export interface AccessTokenResult {
  accessToken: string
  expiresAt: string
}

type SessionListener = (session: AccessTokenResult | null) => void

let currentSession: AccessTokenResult | null = null
let refreshPromise: Promise<AccessTokenResult> | null = null
let sessionVersion = 0
const listeners = new Set<SessionListener>()
const sessionChannel = typeof BroadcastChannel === 'undefined'
  ? null
  : new BroadcastChannel('playr-session')
const REFRESH_LOCK_KEY = 'playr_refresh_lock'

function updateSession(session: AccessTokenResult | null, broadcast: boolean): void {
  sessionVersion += 1
  currentSession = session
  listeners.forEach((listener) => listener(session))
  if (broadcast) sessionChannel?.postMessage(session)
}

sessionChannel?.addEventListener('message', (event: MessageEvent<AccessTokenResult | null>) => {
  const session = event.data
  if (session === null || (typeof session?.accessToken === 'string' && typeof session.expiresAt === 'string')) {
    updateSession(session, false)
  }
})

export function setAccessToken(accessToken: string, expiresAt: string): void {
  updateSession({ accessToken, expiresAt }, true)
}

export function clearAccessToken(): void {
  updateSession(null, true)
}

export function getAccessToken(): string | null {
  return currentSession?.accessToken ?? null
}

export function getAccessTokenExpiresAt(): string | null {
  return currentSession?.expiresAt ?? null
}

export function onSessionChanged(listener: SessionListener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function refreshAccessToken(): Promise<AccessTokenResult> {
  if (refreshPromise) return refreshPromise

  const accessTokenBeforeRefresh = currentSession?.accessToken
  const versionBeforeRefresh = sessionVersion
  refreshPromise = withCrossTabRefreshLock(async () => {
    if (currentSession && currentSession.accessToken !== accessTokenBeforeRefresh) {
      return currentSession
    }

    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'X-Playr-Session': '1' },
    })

    if (!response.ok) {
      if (
        (response.status === 401 || response.status === 403) &&
        sessionVersion !== versionBeforeRefresh &&
        currentSession &&
        currentSession.accessToken !== accessTokenBeforeRefresh
      ) {
        return currentSession
      }
      const message = await parseErrorMessage(response, 'The session has expired.')
      if (response.status === 401 || response.status === 403) clearAccessToken()
      throw new ApiError(response.status, message)
    }

    const result: AccessTokenResult = await response.json()
    if (sessionVersion !== versionBeforeRefresh && currentSession?.accessToken !== accessTokenBeforeRefresh) {
      if (currentSession) return currentSession
      throw new ApiError(401, 'The session changed while it was being refreshed.')
    }
    setAccessToken(result.accessToken, result.expiresAt)
    return result
  }).finally(() => {
    refreshPromise = null
  })

  return refreshPromise
}

async function withCrossTabRefreshLock<T>(callback: () => Promise<T>): Promise<T> {
  const locks = typeof navigator === 'undefined'
    ? undefined
    : (navigator as Navigator & { locks?: LockManager }).locks
  if (locks) return locks.request('playr-refresh', callback)
  if (typeof localStorage === 'undefined') return callback()

  const owner = `${Date.now()}-${Math.random()}`
  while (true) {
    const now = Date.now()
    const currentLock = readRefreshLock()
    if (!currentLock || currentLock.expiresAt <= now) {
      localStorage.setItem(REFRESH_LOCK_KEY, JSON.stringify({ owner, expiresAt: now + 30_000 }))
      await wait(25 + Math.random() * 25)
      if (readRefreshLock()?.owner === owner) {
        try {
          return await callback()
        } finally {
          if (readRefreshLock()?.owner === owner) localStorage.removeItem(REFRESH_LOCK_KEY)
        }
      }
    }
    await wait(50)
  }
}

function readRefreshLock(): { owner: string; expiresAt: number } | null {
  try {
    const value = JSON.parse(localStorage.getItem(REFRESH_LOCK_KEY) ?? 'null')
    return typeof value?.owner === 'string' && typeof value.expiresAt === 'number' ? value : null
  } catch {
    return null
  }
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

export async function withSessionLock<T>(callback: () => Promise<T>): Promise<T> {
  if (refreshPromise) {
    try {
      await refreshPromise
    } catch {
      // Logout still needs to clear a rejected refresh cookie.
    }
  }
  return withCrossTabRefreshLock(callback)
}

export async function getValidAccessToken(fallbackToken?: string | null): Promise<string> {
  if (!currentSession) return fallbackToken ?? ''

  const expiresAt = Date.parse(currentSession.expiresAt)
  if (Number.isFinite(expiresAt) && expiresAt - Date.now() <= 60_000) {
    return (await refreshAccessToken()).accessToken
  }

  return currentSession.accessToken
}

export async function authenticatedFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const inspectedHeaders = new Headers(init.headers)
  if (!inspectedHeaders.has('Authorization')) {
    return Object.keys(init).length === 0 ? fetch(input) : fetch(input, init)
  }

  const suppliedToken = inspectedHeaders.get('Authorization')?.replace(/^Bearer\s+/i, '') ?? ''
  const headers = init.headers instanceof Headers
    ? new Headers(init.headers)
    : { ...(init.headers as Record<string, string> | undefined) }
  if (headers instanceof Headers) {
    headers.set('Authorization', `Bearer ${currentSession?.accessToken ?? suppliedToken}`)
  } else {
    headers.Authorization = `Bearer ${currentSession?.accessToken ?? suppliedToken}`
  }
  const response = await fetch(input, { ...init, headers })
  if (response.status !== 401) return response

  try {
    const refreshed = await refreshAccessToken()
    if (headers instanceof Headers) headers.set('Authorization', `Bearer ${refreshed.accessToken}`)
    else headers.Authorization = `Bearer ${refreshed.accessToken}`
    return fetch(input, { ...init, headers })
  } catch {
    return response
  }
}
