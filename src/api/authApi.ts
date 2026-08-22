export { API_BASE_URL, ApiError } from './http'
import { API_BASE_URL, ApiError, parseErrorMessage } from './http'

export interface UserResponse {
  id: string
  email: string
  username: string
  displayName: string | null
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
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usernameOrEmail, password }),
  })

  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Invalid credentials.')
    throw new ApiError(response.status, message)
  }

  return response.json()
}

export async function getMe(token: string): Promise<UserResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Not authenticated.')
    throw new ApiError(response.status, message)
  }

  return response.json()
}
