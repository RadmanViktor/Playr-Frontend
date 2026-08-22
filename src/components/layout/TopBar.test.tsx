import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TopBar } from './TopBar'

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '1', email: 'a@b.c', username: 'PlayerOne', displayName: null },
    logout: vi.fn(),
  }),
}))

describe('TopBar', () => {
  it('renders search and action buttons', () => {
    render(<TopBar />)
    expect(screen.getByRole('searchbox', { name: 'Search PLAYR' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Notifications' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Messages' })).toBeInTheDocument()
  })
})
