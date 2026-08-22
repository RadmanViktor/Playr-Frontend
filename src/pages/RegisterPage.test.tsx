import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import RegisterPage from './RegisterPage'
import { AuthProvider } from '../context/AuthContext'
import * as authApi from '../api/authApi'

function renderRegisterPage() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <RegisterPage />
      </AuthProvider>
    </MemoryRouter>
  )
}

describe('RegisterPage', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('shows a terminal-style error message when the username is taken', async () => {
    vi.spyOn(authApi, 'register').mockRejectedValue(
      new authApi.ApiError(409, 'Username already taken.')
    )

    const user = userEvent.setup()
    renderRegisterPage()

    await user.type(screen.getByLabelText(/email/i), 'a@b.com')
    await user.type(screen.getByLabelText(/^username$/i), 'someone')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /register/i }))

    await waitFor(() =>
      expect(screen.getByText(/Username already taken\./i)).toBeInTheDocument()
    )
  })

  it('calls register with the entered fields on submit', async () => {
    const registerSpy = vi.spyOn(authApi, 'register').mockResolvedValue({
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
    renderRegisterPage()

    await user.type(screen.getByLabelText(/email/i), 'a@b.com')
    await user.type(screen.getByLabelText(/^username$/i), 'someone')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /register/i }))

    await waitFor(() =>
      expect(registerSpy).toHaveBeenCalledWith('a@b.com', 'someone', 'password123')
    )
  })

  it('has a link to the login page', () => {
    renderRegisterPage()
    expect(screen.getByRole('link', { name: /login instead/i })).toHaveAttribute('href', '/login')
  })

  it('shows client-side validation errors and does not call register when fields are invalid', async () => {
    const registerSpy = vi.spyOn(authApi, 'register')

    const user = userEvent.setup()
    renderRegisterPage()

    await user.type(screen.getByLabelText(/email/i), 'not-an-email')
    await user.type(screen.getByLabelText(/^username$/i), 'ab')
    await user.type(screen.getByLabelText(/password/i), 'short')
    await user.click(screen.getByRole('button', { name: /register/i }))

    expect(await screen.findByText(/enter a valid email address/i)).toBeInTheDocument()
    expect(
      screen.getByText(/username must be between 3 and 32 characters/i)
    ).toBeInTheDocument()
    expect(
      screen.getByText(/password must be at least 8 characters/i)
    ).toBeInTheDocument()
    expect(registerSpy).not.toHaveBeenCalled()
  })
})
