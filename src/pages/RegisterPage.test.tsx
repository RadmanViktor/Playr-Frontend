import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import RegisterPage from './RegisterPage'
import { AuthProvider } from '../context/AuthContext'
import * as authApi from '../api/authApi'

const STRONG_PASSWORD = 'Tr0ub4dor&Elephant'

function renderRegisterPage() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <RegisterPage />
      </AuthProvider>
    </MemoryRouter>
  )
}

function registeredUser() {
  return {
    id: '1',
    email: 'a@b.com',
    username: 'someone',
    displayName: null,
    emailConfirmed: false,
  }
}

/** Fills every field with values that pass client-side validation. */
async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/^email$/i), 'a@b.com')
  await user.type(screen.getByLabelText(/^username$/i), 'someone')
  await user.type(screen.getByLabelText(/^password$/i), STRONG_PASSWORD)
  await user.type(screen.getByLabelText(/^confirm password$/i), STRONG_PASSWORD)
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

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: /^register$/i }))

    await waitFor(() =>
      expect(screen.getByText(/Username already taken\./i)).toBeInTheDocument()
    )
  })

  it('calls register with the entered fields on submit', async () => {
    const registerSpy = vi.spyOn(authApi, 'register').mockResolvedValue(registeredUser())

    const user = userEvent.setup()
    renderRegisterPage()

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: /^register$/i }))

    await waitFor(() =>
      expect(registerSpy).toHaveBeenCalledWith('a@b.com', 'someone', STRONG_PASSWORD)
    )
  })

  it('does not log the user in after registering', async () => {
    vi.spyOn(authApi, 'register').mockResolvedValue(registeredUser())
    const loginSpy = vi.spyOn(authApi, 'login')

    const user = userEvent.setup()
    renderRegisterPage()

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: /^register$/i }))

    await screen.findByText(/check your email/i)
    expect(loginSpy).not.toHaveBeenCalled()
    expect(localStorage.getItem('playr_token')).toBeNull()
  })

  it('tells the user to check their email after registering', async () => {
    vi.spyOn(authApi, 'register').mockResolvedValue(registeredUser())

    const user = userEvent.setup()
    renderRegisterPage()

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: /^register$/i }))

    expect(await screen.findByText(/check your email/i)).toBeInTheDocument()
    expect(screen.getByText('a@b.com')).toBeInTheDocument()
  })

  it('can resend the confirmation email', async () => {
    vi.spyOn(authApi, 'register').mockResolvedValue(registeredUser())
    const resendSpy = vi.spyOn(authApi, 'resendConfirmation').mockResolvedValue(undefined)

    const user = userEvent.setup()
    renderRegisterPage()

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: /^register$/i }))
    await user.click(await screen.findByRole('button', { name: /resend email/i }))

    await waitFor(() => expect(resendSpy).toHaveBeenCalledWith('a@b.com'))
  })

  it('has a link to the login page', () => {
    renderRegisterPage()
    expect(screen.getByRole('link', { name: /login instead/i })).toHaveAttribute('href', '/login')
  })

  it('shows client-side validation errors and does not call register when fields are invalid', async () => {
    const registerSpy = vi.spyOn(authApi, 'register')

    const user = userEvent.setup()
    renderRegisterPage()

    await user.type(screen.getByLabelText(/^email$/i), 'not-an-email')
    await user.type(screen.getByLabelText(/^username$/i), 'ab')
    await user.type(screen.getByLabelText(/^password$/i), 'short')
    await user.click(screen.getByRole('button', { name: /^register$/i }))

    expect(await screen.findByText(/enter a valid email address/i)).toBeInTheDocument()
    expect(
      screen.getByText(/username must be between 3 and 32 characters/i)
    ).toBeInTheDocument()
    expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument()
    expect(registerSpy).not.toHaveBeenCalled()
  })

  it('blocks submission when the passwords do not match', async () => {
    const registerSpy = vi.spyOn(authApi, 'register')

    const user = userEvent.setup()
    renderRegisterPage()

    await user.type(screen.getByLabelText(/^email$/i), 'a@b.com')
    await user.type(screen.getByLabelText(/^username$/i), 'someone')
    await user.type(screen.getByLabelText(/^password$/i), STRONG_PASSWORD)
    await user.type(screen.getByLabelText(/^confirm password$/i), 'Different123!')
    await user.click(screen.getByRole('button', { name: /^register$/i }))

    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument()
    expect(registerSpy).not.toHaveBeenCalled()
  })

  it('blocks submission when the password is too weak', async () => {
    const registerSpy = vi.spyOn(authApi, 'register')

    const user = userEvent.setup()
    renderRegisterPage()

    // Meets the letter of the policy but is a well-known weak sequence.
    await user.type(screen.getByLabelText(/^email$/i), 'a@b.com')
    await user.type(screen.getByLabelText(/^username$/i), 'someone')
    await user.type(screen.getByLabelText(/^password$/i), 'Qwerty12345')
    await user.type(screen.getByLabelText(/^confirm password$/i), 'Qwerty12345')
    await user.click(screen.getByRole('button', { name: /^register$/i }))

    expect(await screen.findByText(/password is too weak/i)).toBeInTheDocument()
    expect(registerSpy).not.toHaveBeenCalled()
  })

  it('shows the strength meter once the user starts typing a password', async () => {
    const user = userEvent.setup()
    renderRegisterPage()

    expect(screen.queryByText(/password strength/i)).not.toBeInTheDocument()
    await user.type(screen.getByLabelText(/^password$/i), 'abc')
    expect(screen.getByText(/password strength: weak/i)).toBeInTheDocument()
  })

  it('clears a field error as soon as the user corrects it', async () => {
    const user = userEvent.setup()
    renderRegisterPage()

    await user.type(screen.getByLabelText(/^email$/i), 'nope')
    await user.click(screen.getByRole('button', { name: /^register$/i }))
    expect(await screen.findByText(/enter a valid email address/i)).toBeInTheDocument()

    await user.type(screen.getByLabelText(/^email$/i), '@example.com')
    expect(screen.queryByText(/enter a valid email address/i)).not.toBeInTheDocument()
  })

  it('can reveal and hide the password', async () => {
    const user = userEvent.setup()
    renderRegisterPage()

    const passwordInput = screen.getByLabelText(/^password$/i)
    expect(passwordInput).toHaveAttribute('type', 'password')

    await user.click(screen.getByRole('button', { name: /show password/i }))
    expect(passwordInput).toHaveAttribute('type', 'text')

    await user.click(screen.getByRole('button', { name: /hide password/i }))
    expect(passwordInput).toHaveAttribute('type', 'password')
  })
})
