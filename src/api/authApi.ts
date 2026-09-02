export { API_BASE_URL, ApiError } from './http'
import { API_BASE_URL, ApiError, parseErrorMessage } from './http'
import { authenticatedFetch, refreshAccessToken, withSessionLock } from './session'

export interface UserResponse {
  id: string
  email: string
  username: string
  displayName: string | null
  emailConfirmed: boolean
}

export interface LoginResponse {
  accessToken: string
  expiresAt: string
}

export async function register(
  email: string,
  username: string,
  password: string
): Promise<UserResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, username, password }),
  })

  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Registration failed.')
    throw new ApiError(response.status, message)
  }

  return response.json()
}

export async function login(usernameOrEmail: string, password: string): Promise<LoginResponse> {
  const response = await withSessionLock(() => fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usernameOrEmail, password }),
  }))

  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Invalid credentials.')
    throw new ApiError(response.status, message)
  }

  return response.json()
}

export async function getMe(token: string): Promise<UserResponse> {
  const response = await authenticatedFetch(`${API_BASE_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Not authenticated.')
    throw new ApiError(response.status, message)
  }

  return response.json()
}

export async function refreshSession(): Promise<LoginResponse> {
  return refreshAccessToken()
}

export async function logoutSession(): Promise<void> {
  const response = await withSessionLock(() => fetch(`${API_BASE_URL}/api/auth/logout`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'X-Playr-Session': '1' },
  }))

  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Could not end the session.')
    throw new ApiError(response.status, message)
  }
}

export async function confirmEmail(userId: string, token: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/auth/confirm-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, token }),
  })

  if (!response.ok) {
    const message = await parseErrorMessage(
      response,
      'This confirmation link is invalid or has expired.'
    )
    throw new ApiError(response.status, message)
  }
}

/**
 * Always resolves for any syntactically valid address - the server deliberately
 * does not reveal whether an account exists.
 */
export async function resendConfirmation(email: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/auth/resend-confirmation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })

  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Could not send the confirmation email.')
    throw new ApiError(response.status, message)
  }
}

/**
 * Always resolves for any syntactically valid address - the server deliberately
 * does not reveal whether an account exists.
 */
export async function forgotPassword(email: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })

  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Could not send the password reset email.')
    throw new ApiError(response.status, message)
  }
}

export async function resetPassword(
  userId: string,
  token: string,
  newPassword: string
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, token, newPassword }),
  })

  if (!response.ok) {
    const message = await parseErrorMessage(
      response,
      'This password reset link is invalid or has expired.'
    )
    throw new ApiError(response.status, message)
  }
}
