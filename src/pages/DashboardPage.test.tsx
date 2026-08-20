import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import DashboardPage from './DashboardPage'
import { AuthProvider } from '../context/AuthContext'
import * as authApi from '../api/authApi'

describe('DashboardPage', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('shows a welcome message with the current username', async () => {
    localStorage.setItem('playr_token', 'abc123')
    vi.spyOn(authApi, 'getMe').mockResolvedValue({
      id: '1',
      email: 'a@b.com',
      username: 'someone',
      displayName: null,
    })

    render(
      <MemoryRouter>
        <AuthProvider>
          <DashboardPage />
        </AuthProvider>
      </MemoryRouter>
    )

    await waitFor(() => expect(screen.getByText(/welcome, someone_/i)).toBeInTheDocument())
  })

  it('clears the stored token when logout is clicked', async () => {
    localStorage.setItem('playr_token', 'abc123')
    vi.spyOn(authApi, 'getMe').mockResolvedValue({
      id: '1',
      email: 'a@b.com',
      username: 'someone',
      displayName: null,
    })

    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <AuthProvider>
          <DashboardPage />
        </AuthProvider>
      </MemoryRouter>
    )

    await waitFor(() => expect(screen.getByText(/welcome, someone_/i)).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: /logout/i }))

    expect(localStorage.getItem('playr_token')).toBeNull()
  })
})
