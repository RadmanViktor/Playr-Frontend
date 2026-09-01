import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import ResetPasswordPage from './ResetPasswordPage'
import * as authApi from '../api/authApi'

function renderAt(search: string) {
  return render(
    <MemoryRouter initialEntries={[`/reset-password${search}`]}>
      <ResetPasswordPage />
    </MemoryRouter>
  )
}

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('reports an incomplete link without calling the API', async () => {
    const resetSpy = vi.spyOn(authApi, 'resetPassword')

    renderAt('?userId=abc-123')

    expect(
      await screen.findByText(/this password reset link is incomplete or invalid/i)
    ).toBeInTheDocument()
    expect(resetSpy).not.toHaveBeenCalled()
  })

  it('shows a validation error and does not call the API for a weak password', async () => {
    const resetSpy = vi.spyOn(authApi, 'resetPassword')

    const user = userEvent.setup()
    renderAt('?userId=abc-123&token=tok-456')

    await user.type(screen.getByLabelText(/^new password$/i), 'weak')
    await user.type(screen.getByLabelText(/confirm new password/i), 'weak')
    await user.click(screen.getByRole('button', { name: /reset password/i }))

    expect(await screen.findByText(/password must be at least 8 characters/i)).toBeInTheDocument()
    expect(resetSpy).not.toHaveBeenCalled()
  })

  it('resets the password using the query parameters', async () => {
    const resetSpy = vi.spyOn(authApi, 'resetPassword').mockResolvedValue(undefined)

    const user = userEvent.setup()
    renderAt('?userId=abc-123&token=tok-456')

    await user.type(screen.getByLabelText(/^new password$/i), 'NewPassword123')
    await user.type(screen.getByLabelText(/confirm new password/i), 'NewPassword123')
    await user.click(screen.getByRole('button', { name: /reset password/i }))

    await waitFor(() =>
      expect(resetSpy).toHaveBeenCalledWith('abc-123', 'tok-456', 'NewPassword123')
    )
    expect(await screen.findByText(/your password has been reset/i)).toBeInTheDocument()
  })

  it('reports an expired or invalid link', async () => {
    vi.spyOn(authApi, 'resetPassword').mockRejectedValue(
      new authApi.ApiError(400, 'This password reset link is invalid or has expired.')
    )

    const user = userEvent.setup()
    renderAt('?userId=abc-123&token=bad')

    await user.type(screen.getByLabelText(/^new password$/i), 'NewPassword123')
    await user.type(screen.getByLabelText(/confirm new password/i), 'NewPassword123')
    await user.click(screen.getByRole('button', { name: /reset password/i }))

    expect(
      await screen.findByText(/this password reset link is invalid or has expired/i)
    ).toBeInTheDocument()
  })
})
