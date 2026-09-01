import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import ForgotPasswordPage from './ForgotPasswordPage'
import * as authApi from '../api/authApi'

function renderPage() {
  return render(
    <MemoryRouter>
      <ForgotPasswordPage />
    </MemoryRouter>
  )
}

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('shows a validation error and does not call the API for an invalid email', async () => {
    const forgotSpy = vi.spyOn(authApi, 'forgotPassword')

    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: /send reset link/i }))

    expect(await screen.findByText(/email is required/i)).toBeInTheDocument()
    expect(forgotSpy).not.toHaveBeenCalled()
  })

  it('sends the reset request and shows a confirmation message', async () => {
    const forgotSpy = vi.spyOn(authApi, 'forgotPassword').mockResolvedValue(undefined)

    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText(/email/i), 'someone@example.com')
    await user.click(screen.getByRole('button', { name: /send reset link/i }))

    await waitFor(() => expect(forgotSpy).toHaveBeenCalledWith('someone@example.com'))
    expect(
      await screen.findByText(/if that address belongs to an account/i)
    ).toBeInTheDocument()
  })

  it('shows the confirmation message even when the request fails, so accounts cannot be enumerated', async () => {
    vi.spyOn(authApi, 'forgotPassword').mockRejectedValue(
      new authApi.ApiError(500, 'Something went wrong.')
    )

    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText(/email/i), 'someone@example.com')
    await user.click(screen.getByRole('button', { name: /send reset link/i }))

    expect(
      await screen.findByText(/if that address belongs to an account/i)
    ).toBeInTheDocument()
  })

  it('has a link back to the login page', () => {
    renderPage()
    expect(screen.getByRole('link', { name: /go to login/i })).toHaveAttribute('href', '/login')
  })
})
