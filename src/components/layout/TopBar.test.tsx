import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { TopBar } from './TopBar'
import { addRecentSearch, getRecentSearches } from '../../lib/recentSearches'

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

vi.mock('../../api/profilesApi', () => ({
  searchProfiles: vi.fn().mockResolvedValue([
    { userId: 'u2', username: 'bob', displayName: 'Bob Smith', avatarUrl: null },
  ]),
}))

vi.mock('../../context/ChatContext', () => ({
  useChat: () => ({
    openChatWithUser: vi.fn(),
  }),
}))

vi.mock('../../context/NotificationContext', () => ({
  useNotifications: () => mockUseNotifications(),
}))

const mockUseNotifications = vi.fn(() => ({
  notifications: [] as unknown[],
  unreadCount: 0,
  isLoading: false,
  markRead: vi.fn(),
  markAllRead: vi.fn(),
  deleteNotification: vi.fn(),
  clearAllNotifications: vi.fn(),
}))

describe('TopBar', () => {
  beforeEach(() => {
    localStorage.clear()
    mockUseNotifications.mockReturnValue({
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      markRead: vi.fn(),
      markAllRead: vi.fn(),
      deleteNotification: vi.fn(),
      clearAllNotifications: vi.fn(),
    })
  })

  it('renders search and action buttons', () => {
    render(<TopBar />, { wrapper: MemoryRouter })
    expect(screen.getByRole('searchbox', { name: 'Search PLAYR' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Messages' })).toBeInTheDocument()
  })

  it('shows recent searches when the empty search input is focused', () => {
    addRecentSearch({
      userId: 'u1',
      username: 'jane',
      displayName: 'Jane Doe',
      avatarUrl: null,
    })
    render(<TopBar />, { wrapper: MemoryRouter })
    fireEvent.focus(screen.getByRole('searchbox', { name: 'Search PLAYR' }))
    expect(screen.getByText('Jane Doe')).toBeInTheDocument()
    expect(screen.getByText('@jane')).toBeInTheDocument()
  })

  it('removes a single recent search when its remove button is clicked', () => {
    addRecentSearch({
      userId: 'u1',
      username: 'jane',
      displayName: 'Jane Doe',
      avatarUrl: null,
    })
    render(<TopBar />, { wrapper: MemoryRouter })
    fireEvent.focus(screen.getByRole('searchbox', { name: 'Search PLAYR' }))
    fireEvent.click(screen.getByRole('button', { name: 'Remove Jane Doe from recent searches' }))
    expect(screen.queryByText('Jane Doe')).not.toBeInTheDocument()
    expect(getRecentSearches()).toHaveLength(0)
  })

  it('clears all recent searches when "Clear all" is clicked', () => {
    addRecentSearch({
      userId: 'u1',
      username: 'jane',
      displayName: 'Jane Doe',
      avatarUrl: null,
    })
    render(<TopBar />, { wrapper: MemoryRouter })
    fireEvent.focus(screen.getByRole('searchbox', { name: 'Search PLAYR' }))
    fireEvent.click(screen.getByRole('button', { name: 'Clear all' }))
    expect(screen.queryByText('Jane Doe')).not.toBeInTheDocument()
    expect(getRecentSearches()).toHaveLength(0)
  })

  it('saves a selected search result to recent searches', async () => {
    render(<TopBar />, { wrapper: MemoryRouter })
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search PLAYR' }), {
      target: { value: 'bob' },
    })
    await waitFor(() => expect(screen.getByText('Bob Smith')).toBeInTheDocument())
    fireEvent.click(screen.getByText('Bob Smith'))
    expect(getRecentSearches().some((s) => s.userId === 'u2')).toBe(true)
  })

  it('opens the profile menu with view profile, settings and sign out', () => {
    render(<TopBar />, { wrapper: MemoryRouter })
    fireEvent.click(screen.getByRole('button', { name: 'My profile' }))
    expect(screen.getByRole('button', { name: /view profile/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument()
  })

  it('deletes a single notification without navigating when its remove button is clicked', () => {
    const deleteNotification = vi.fn()
    mockUseNotifications.mockReturnValue({
      notifications: [
        {
          id: 'n1',
          type: 'NewFollower',
          isRead: false,
          createdAt: new Date().toISOString(),
          actor: { userId: 'u2', username: 'bob', displayName: 'Bob Smith', avatarUrl: null },
          postId: null,
          commentId: null,
          lfgGroupId: null,
        },
      ],
      unreadCount: 1,
      isLoading: false,
      markRead: vi.fn(),
      markAllRead: vi.fn(),
      deleteNotification,
      clearAllNotifications: vi.fn(),
    })
    render(<TopBar />, { wrapper: MemoryRouter })
    fireEvent.click(screen.getByRole('button', { name: 'Notifications' }))
    fireEvent.click(screen.getByRole('button', { name: 'Remove notification' }))
    expect(deleteNotification).toHaveBeenCalledWith('n1')
  })

  it('clears all notifications when "Clear all" is clicked in the notifications dropdown', () => {
    const clearAllNotifications = vi.fn()
    mockUseNotifications.mockReturnValue({
      notifications: [
        {
          id: 'n1',
          type: 'NewFollower',
          isRead: false,
          createdAt: new Date().toISOString(),
          actor: { userId: 'u2', username: 'bob', displayName: 'Bob Smith', avatarUrl: null },
          postId: null,
          commentId: null,
          lfgGroupId: null,
        },
      ],
      unreadCount: 1,
      isLoading: false,
      markRead: vi.fn(),
      markAllRead: vi.fn(),
      deleteNotification: vi.fn(),
      clearAllNotifications,
    })
    render(<TopBar />, { wrapper: MemoryRouter })
    fireEvent.click(screen.getByRole('button', { name: 'Notifications' }))
    fireEvent.click(screen.getByRole('button', { name: 'Clear all' }))
    expect(clearAllNotifications).toHaveBeenCalled()
  })
})
