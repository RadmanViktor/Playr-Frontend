import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
import { AuthProvider } from '../context/AuthContext'
import * as authApi from '../api/authApi'

function renderWithRoute(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<div>login page</div>} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <div>secret dashboard</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  )
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('redirects to /login when there is no stored token', async () => {
    renderWithRoute('/')

    await waitFor(() => expect(screen.getByText('login page')).toBeInTheDocument())
  })

  it('renders children when a valid token/user is present', async () => {
    localStorage.setItem('playr_token', 'abc123')
    vi.spyOn(authApi, 'getMe').mockResolvedValue({
      id: '1',
      email: 'a@b.com',
      username: 'someone',
      displayName: null,
    })

    renderWithRoute('/')

    await waitFor(() => expect(screen.getByText('secret dashboard')).toBeInTheDocument())
  })

  it('shows a loading state while the user is being fetched', async () => {
    localStorage.setItem('playr_token', 'abc123')
    let resolveGetMe: (value: authApi.UserResponse) => void
    vi.spyOn(authApi, 'getMe').mockReturnValue(
      new Promise((resolve) => {
        resolveGetMe = resolve
      })
    )

    renderWithRoute('/')

    expect(screen.getByText('Loading…')).toBeInTheDocument()

    resolveGetMe!({
      id: '1',
      email: 'a@b.com',
      username: 'someone',
      displayName: null,
    })

    await waitFor(() => expect(screen.getByText('secret dashboard')).toBeInTheDocument())
  })
})
