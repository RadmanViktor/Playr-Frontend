import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { login, register, getMe, API_BASE_URL } from './authApi'

describe('authApi', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('login posts credentials and returns the access token on success', async () => {
    const mockResponse = { accessToken: 'abc123', expiresAt: '2026-01-01T00:00:00Z' }
    ;(fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    const result = await login('someone', 'password123')

    expect(fetch).toHaveBeenCalledWith(
      `${API_BASE_URL}/api/auth/login`,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ usernameOrEmail: 'someone', password: 'password123' }),
      })
    )
    expect(result).toEqual(mockResponse)
  })

  it('login throws ApiError with the server message on 401', async () => {
    ;(fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Invalid credentials.' }),
    })

    await expect(login('someone', 'wrong')).rejects.toMatchObject({
      message: 'Invalid credentials.',
      status: 401,
    })
  })

  it('register posts the new user payload and returns the created user', async () => {
    const mockUser = { id: '1', email: 'a@b.com', username: 'someone', displayName: null }
    ;(fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockUser,
    })

    const result = await register('a@b.com', 'someone', 'password123')

    expect(fetch).toHaveBeenCalledWith(
      `${API_BASE_URL}/api/auth/register`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'a@b.com', username: 'someone', password: 'password123' }),
      })
    )
    expect(result).toEqual(mockUser)
  })

  it('register throws ApiError with the server message on 409', async () => {
    ;(fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: async () => ({ error: 'Username already taken.' }),
    })

    await expect(register('a@b.com', 'someone', 'password123')).rejects.toMatchObject({
      message: 'Username already taken.',
      status: 409,
    })
  })

  it('register flattens ASP.NET Core ValidationProblemDetails errors into a readable message', async () => {
    ;(fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        title: 'One or more validation errors occurred.',
        status: 400,
        errors: {
          Password: ["The field Password must be a string with a minimum length of '8'."],
          Email: ['The Email field is not a valid e-mail address.'],
        },
      }),
    })

    await expect(register('bad-email', 'someone', 'short')).rejects.toMatchObject({
      message:
        "The field Password must be a string with a minimum length of '8'. The Email field is not a valid e-mail address.",
      status: 400,
    })
  })

  it('getMe sends the bearer token and returns the current user', async () => {
    const mockUser = { id: '1', email: 'a@b.com', username: 'someone', displayName: null }
    ;(fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockUser,
    })

    const result = await getMe('token-value')

    expect(fetch).toHaveBeenCalledWith(
      `${API_BASE_URL}/api/auth/me`,
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer token-value' }),
      })
    )
    expect(result).toEqual(mockUser)
  })
})
