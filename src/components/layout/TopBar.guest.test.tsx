import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { TopBar } from './TopBar'

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: null, token: null, logout: vi.fn() }),
}))

vi.mock('../../context/StatusContext', () => ({
  useStatus: () => ({ avatarUrl: null }),
}))

vi.mock('../../context/ChatContext', () => ({
  useChat: () => ({ openChatWithUser: vi.fn() }),
}))

vi.mock('../../context/NotificationContext', () => ({
  useNotifications: () => ({
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    markRead: vi.fn(),
    markAllRead: vi.fn(),
    deleteNotification: vi.fn(),
    clearAllNotifications: vi.fn(),
  }),
}))

describe('TopBar guest navigation', () => {
  it('shows links to login and registration', () => {
    render(<TopBar />, { wrapper: MemoryRouter })

    expect(screen.getByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/login')
    expect(screen.getByRole('link', { name: 'Create account' })).toHaveAttribute(
      'href',
      '/register',
    )
  })
})
