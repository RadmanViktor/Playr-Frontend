import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import LoginPage from './LoginPage'
import { AuthProvider } from '../context/AuthContext'
import * as authApi from '../api/authApi'

function renderLoginPage() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    </MemoryRouter>
  )
}

describe('LoginPage', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('shows a terminal-style error message on invalid credentials', async () => {
    vi.spyOn(authApi, 'login').mockRejectedValue(new authApi.ApiError(401, 'Invalid credentials.'))

    const user = userEvent.setup()
    renderLoginPage()

    await user.type(screen.getByLabelText(/username or email/i), 'someone')
    await user.type(screen.getByLabelText(/password/i), 'wrongpass')
    await user.click(screen.getByRole('button', { name: /log in/i }))

    await waitFor(() =>
      expect(screen.getByText(/Invalid credentials\./i)).toBeInTheDocument()
    )
  })

  it('calls login with the entered credentials on submit', async () => {
    const loginSpy = vi.spyOn(authApi, 'login').mockResolvedValue({
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
    renderLoginPage()

    await user.type(screen.getByLabelText(/username or email/i), 'someone')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /log in/i }))

    await waitFor(() => expect(loginSpy).toHaveBeenCalledWith('someone', 'password123'))
  })

  it('has a link to the register page', () => {
    renderLoginPage()
    expect(screen.getByRole('link', { name: /register instead/i })).toHaveAttribute(
      'href',
      '/register'
    )
  })

  it('shows client-side validation errors and does not call login when fields are empty', async () => {
    const loginSpy = vi.spyOn(authApi, 'login')

    const user = userEvent.setup()
    renderLoginPage()

    await user.click(screen.getByRole('button', { name: /log in/i }))

    expect(await screen.findByText(/username or email is required/i)).toBeInTheDocument()
    expect(screen.getByText(/password is required/i)).toBeInTheDocument()
    expect(loginSpy).not.toHaveBeenCalled()
  })
})
