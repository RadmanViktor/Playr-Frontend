import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider, useAuth } from './AuthContext'
import * as authApi from '../api/authApi'

function TestConsumer() {
  const auth = useAuth()
  return (
    <div>
      <span data-testid="user">{auth.user ? auth.user.username : 'none'}</span>
      <span data-testid="loading">{auth.isLoading ? 'loading' : 'idle'}</span>
      <button onClick={() => auth.login('someone', 'password123')}>login</button>
      <button onClick={() => auth.register('a@b.com', 'someone', 'password123')}>register</button>
      <button onClick={() => auth.logout()}>logout</button>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.spyOn(authApi, 'refreshSession').mockRejectedValue(new authApi.ApiError(401, 'No session.'))
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('starts with no user and not loading when there is no stored token', async () => {
    vi.spyOn(authApi, 'getMe').mockResolvedValue({
      id: '1',
      email: 'a@b.com',
      username: 'someone',
      displayName: null,
      emailConfirmed: true,
    })

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('idle'))
    expect(screen.getByTestId('user')).toHaveTextContent('none')
  })

  it('login stores the token and loads the user', async () => {
    vi.spyOn(authApi, 'login').mockResolvedValue({
      accessToken: 'abc123',
      expiresAt: '2026-01-01T00:00:00Z',
    })
    vi.spyOn(authApi, 'getMe').mockResolvedValue({
      id: '1',
      email: 'a@b.com',
      username: 'someone',
      displayName: null,
      emailConfirmed: true,
    })

    const user = userEvent.setup()
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('idle'))
    await user.click(screen.getByText('login'))

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('someone'))
    expect(localStorage.getItem('playr_token')).toBeNull()
  })

  it('register does not log the user in, since the email must be confirmed first', async () => {
    vi.spyOn(authApi, 'register').mockResolvedValue({
      id: '1',
      email: 'a@b.com',
      username: 'someone',
      displayName: null,
      emailConfirmed: false,
    })
    vi.spyOn(authApi, 'login').mockResolvedValue({
      accessToken: 'abc123',
      expiresAt: '2026-01-01T00:00:00Z',
    })

    const user = userEvent.setup()
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('idle'))
    await user.click(screen.getByText('register'))

    await waitFor(() =>
      expect(authApi.register).toHaveBeenCalledWith('a@b.com', 'someone', 'password123')
    )
    expect(authApi.login).not.toHaveBeenCalled()
    expect(screen.getByTestId('user')).toHaveTextContent('none')
    expect(localStorage.getItem('playr_token')).toBeNull()
  })

  it('logout clears the token and user', async () => {
    vi.spyOn(authApi, 'login').mockResolvedValue({
      accessToken: 'abc123',
      expiresAt: '2026-01-01T00:00:00Z',
    })
    vi.spyOn(authApi, 'getMe').mockResolvedValue({
      id: '1',
      email: 'a@b.com',
      username: 'someone',
      displayName: null,
      emailConfirmed: true,
    })
    vi.spyOn(authApi, 'logoutSession').mockResolvedValue()

    const user = userEvent.setup()
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('idle'))
    await user.click(screen.getByText('login'))
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('someone'))

    await user.click(screen.getByText('logout'))

    expect(screen.getByTestId('user')).toHaveTextContent('none')
    expect(localStorage.getItem('playr_token')).toBeNull()
    expect(authApi.logoutSession).toHaveBeenCalledOnce()
    expect(localStorage.getItem('playr_pending_logout')).toBeNull()
  })

  it('keeps logout pending when the API is unavailable', async () => {
    vi.spyOn(authApi, 'login').mockResolvedValue({
      accessToken: 'abc123',
      expiresAt: '2099-01-01T00:00:00Z',
    })
    vi.spyOn(authApi, 'getMe').mockResolvedValue({
      id: '1',
      email: 'a@b.com',
      username: 'someone',
      displayName: null,
      emailConfirmed: true,
    })
    vi.spyOn(authApi, 'logoutSession').mockRejectedValue(new TypeError('offline'))
    const user = userEvent.setup()
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('idle'))
    await user.click(screen.getByText('login'))
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('someone'))

    await user.click(screen.getByText('logout'))

    await waitFor(() => expect(localStorage.getItem('playr_pending_logout')).toBe('1'))
    expect(screen.getByTestId('user')).toHaveTextContent('none')
  })

  it('finishes a pending logout before attempting session restoration', async () => {
    localStorage.setItem('playr_pending_logout', '1')
    vi.spyOn(authApi, 'logoutSession').mockResolvedValue()

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('idle'))
    expect(authApi.logoutSession).toHaveBeenCalledOnce()
    expect(authApi.refreshSession).not.toHaveBeenCalled()
    expect(localStorage.getItem('playr_pending_logout')).toBeNull()
  })

  it('restores a user from the refresh cookie on startup', async () => {
    vi.spyOn(authApi, 'refreshSession').mockResolvedValue({
      accessToken: 'restored',
      expiresAt: '2099-01-01T00:00:00Z',
    })
    vi.spyOn(authApi, 'getMe').mockResolvedValue({
      id: '1',
      email: 'a@b.com',
      username: 'someone',
      displayName: null,
      emailConfirmed: true,
    })

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('someone'))
    expect(authApi.refreshSession).toHaveBeenCalledOnce()
  })
})
