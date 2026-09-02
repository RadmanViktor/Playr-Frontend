import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NotificationProvider, useNotifications } from './NotificationContext'
import * as notificationsApi from '../api/notificationsApi'

const notificationHub = vi.hoisted(() => ({
  listener: null as ((notification: notificationsApi.NotificationItem) => void) | null,
}))

vi.mock('../api/notificationsApi', async () => {
  const actual = await vi.importActual<typeof import('../api/notificationsApi')>('../api/notificationsApi')
  return {
    ...actual,
    getNotifications: vi.fn(),
    markNotificationRead: vi.fn(),
    markAllNotificationsRead: vi.fn(),
  }
})

vi.mock('../lib/chatHubConnection', () => ({
  onNotificationReceived: vi.fn((listener: (notification: notificationsApi.NotificationItem) => void) => {
    notificationHub.listener = listener
    return () => {
      notificationHub.listener = null
    }
  }),
}))

vi.mock('./AuthContext', () => ({
  useAuth: () => ({ user: { id: 'u1' }, token: 'token' }),
}))

vi.mock('./NotificationPreferencesContext', () => ({
  useNotificationPreferences: () => ({
    preferences: { chatSoundEnabled: false, chatBrowserNotificationsEnabled: false },
  }),
}))

function badgeNotification(id: string, badgeType: string): notificationsApi.NotificationItem {
  return {
    id,
    type: 'BadgeUnlocked',
    isRead: false,
    createdAt: new Date().toISOString(),
    actor: { userId: 'u1', username: 'ada', displayName: 'Ada', avatarUrl: null },
    postId: null,
    commentId: null,
    badgeType,
    badgeLevel: 'Gold',
    lfgGroupId: null,
  }
}

function Consumer() {
  const { markAllRead } = useNotifications()
  return <button onClick={() => void markAllRead()}>Mark all read</button>
}

describe('NotificationProvider badge celebrations', () => {
  beforeEach(() => {
    vi.mocked(notificationsApi.getNotifications).mockReset()
    vi.mocked(notificationsApi.markNotificationRead).mockReset()
    vi.mocked(notificationsApi.markNotificationRead).mockResolvedValue(undefined)
    vi.mocked(notificationsApi.markAllNotificationsRead).mockReset()
    vi.mocked(notificationsApi.markAllNotificationsRead).mockResolvedValue(undefined)
    notificationHub.listener = null
  })

  it('shows unread badge unlocks one at a time and marks each one read', async () => {
    vi.mocked(notificationsApi.getNotifications).mockResolvedValue({
      items: [badgeNotification('n1', 'Voidtouched'), badgeNotification('n2', 'GameCritic')],
      hasMore: false,
      unreadCount: 2,
    })
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <NotificationProvider><div>Application</div></NotificationProvider>
      </MemoryRouter>,
    )

    expect(await screen.findByText('Voidtouched')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Continue' }))

    expect(notificationsApi.markNotificationRead).toHaveBeenCalledWith('token', 'n1')
    expect(await screen.findByText('Game Critic')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(notificationsApi.markNotificationRead).toHaveBeenCalledWith('token', 'n2')
  })

  it('keeps a live badge unlock that arrives while the initial feed is loading', async () => {
    let resolveFeed!: (feed: notificationsApi.NotificationFeed) => void
    vi.mocked(notificationsApi.getNotifications).mockImplementation(
      () => new Promise((resolve) => { resolveFeed = resolve }),
    )

    render(
      <MemoryRouter>
        <NotificationProvider><div>Application</div></NotificationProvider>
      </MemoryRouter>,
    )

    await waitFor(() => expect(notificationHub.listener).not.toBeNull())
    act(() => notificationHub.listener?.(badgeNotification('live', 'Voidtouched')))
    expect(await screen.findByText('Voidtouched')).toBeInTheDocument()

    await act(async () => resolveFeed({ items: [], hasMore: false, unreadCount: 0 }))

    expect(screen.getByText('Voidtouched')).toBeInTheDocument()
  })

  it('does not restore unread celebrations after mark all during initial loading', async () => {
    let resolveFeed!: (feed: notificationsApi.NotificationFeed) => void
    vi.mocked(notificationsApi.getNotifications).mockImplementation(
      () => new Promise((resolve) => { resolveFeed = resolve }),
    )
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <NotificationProvider><Consumer /></NotificationProvider>
      </MemoryRouter>,
    )

    await waitFor(() => expect(notificationHub.listener).not.toBeNull())
    const notification = badgeNotification('live', 'Voidtouched')
    act(() => notificationHub.listener?.(notification))
    expect(await screen.findByText('Voidtouched')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Mark all read' }))
    await act(async () => resolveFeed({ items: [notification], hasMore: false, unreadCount: 1 }))

    expect(screen.queryByText('Voidtouched')).not.toBeInTheDocument()
  })
})
