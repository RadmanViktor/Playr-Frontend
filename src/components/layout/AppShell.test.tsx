import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AppShell } from './AppShell'

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '1', email: 'a@b.c', username: 'PlayerOne', displayName: null },
    logout: vi.fn(),
  }),
}))

vi.mock('../../context/StatusContext', () => ({
  useStatus: () => ({
    status: 'Online',
    lookingForGameId: null,
    lookingForGameName: null,
    lookingForPlayStyle: null,
    isLoading: false,
    updateStatus: vi.fn(),
  }),
}))

describe('AppShell', () => {
  it('renders sidebar nav and routed child content', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<div>Home content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument()
    expect(screen.getByText('Home content')).toBeInTheDocument()
  })
})
