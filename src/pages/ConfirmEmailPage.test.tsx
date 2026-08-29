import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import ConfirmEmailPage from './ConfirmEmailPage'
import * as authApi from '../api/authApi'

function renderAt(search: string) {
  return render(
    <MemoryRouter initialEntries={[`/confirm-email${search}`]}>
      <ConfirmEmailPage />
    </MemoryRouter>
  )
}

describe('ConfirmEmailPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('confirms the email using the query parameters', async () => {
    const confirmSpy = vi.spyOn(authApi, 'confirmEmail').mockResolvedValue(undefined)

    renderAt('?userId=abc-123&token=tok-456')

    await waitFor(() => expect(confirmSpy).toHaveBeenCalledWith('abc-123', 'tok-456'))
    expect(await screen.findByText(/your email address is confirmed/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /go to login/i })).toHaveAttribute('href', '/login')
  })

  it('calls the API only once even when the effect runs twice', async () => {
    const confirmSpy = vi.spyOn(authApi, 'confirmEmail').mockResolvedValue(undefined)

    renderAt('?userId=abc-123&token=tok-456')

    await screen.findByText(/your email address is confirmed/i)
    expect(confirmSpy).toHaveBeenCalledTimes(1)
  })

  it('reports an expired or invalid link', async () => {
    vi.spyOn(authApi, 'confirmEmail').mockRejectedValue(
      new authApi.ApiError(400, 'This confirmation link is invalid or has expired.')
    )

    renderAt('?userId=abc-123&token=bad')

    expect(
      await screen.findByText(/this confirmation link is invalid or has expired/i)
    ).toBeInTheDocument()
  })

  it('reports an incomplete link without calling the API', async () => {
    const confirmSpy = vi.spyOn(authApi, 'confirmEmail')

    renderAt('?userId=abc-123')

    expect(await screen.findByText(/this confirmation link is incomplete/i)).toBeInTheDocument()
    expect(confirmSpy).not.toHaveBeenCalled()
  })

  it('can request a new link after a failure', async () => {
    vi.spyOn(authApi, 'confirmEmail').mockRejectedValue(new authApi.ApiError(400, 'Expired.'))
    const resendSpy = vi.spyOn(authApi, 'resendConfirmation').mockResolvedValue(undefined)

    const user = userEvent.setup()
    renderAt('?userId=abc-123&token=bad')

    await screen.findByText(/expired\./i)
    await user.type(screen.getByLabelText(/email/i), 'someone@example.com')
    await user.click(screen.getByRole('button', { name: /send new link/i }))

    await waitFor(() => expect(resendSpy).toHaveBeenCalledWith('someone@example.com'))
  })
})
