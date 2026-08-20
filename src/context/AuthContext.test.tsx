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
    expect(localStorage.getItem('playr_token')).toBe('abc123')
  })

  it('register calls register then login and loads the user', async () => {
    vi.spyOn(authApi, 'register').mockResolvedValue({
      id: '1',
      email: 'a@b.com',
      username: 'someone',
      displayName: null,
    })
    vi.spyOn(authApi, 'login').mockResolvedValue({
      accessToken: 'abc123',
      expiresAt: '2026-01-01T00:00:00Z',
    })
    vi.spyOn(authApi, 'getMe').mockResolvedValue({
      id: '1',
      email: 'a@b.com',
      username: 'someone',
      displayName: null,
    })

    const user = userEvent.setup()
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('idle'))
    await user.click(screen.getByText('register'))

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('someone'))
    expect(authApi.register).toHaveBeenCalledWith('a@b.com', 'someone', 'password123')
    expect(authApi.login).toHaveBeenCalledWith('someone', 'password123')
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

    await user.click(screen.getByText('logout'))

    expect(screen.getByTestId('user')).toHaveTextContent('none')
    expect(localStorage.getItem('playr_token')).toBeNull()
  })
})
