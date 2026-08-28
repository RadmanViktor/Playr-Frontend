import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
    avatarUrl: null,
    lookingForGameId: null,
    lookingForGameName: null,
    lookingForPlayStyle: null,
    isLoading: false,
    updateStatus: vi.fn(),
  }),
}))

vi.mock('../../context/ChatContext', () => ({
  useChat: () => ({
    hasUnread: false,
    unreadConversationIds: new Set<string>(),
    openChatWithUser: vi.fn(),
    openConversation: vi.fn(),
    closeChat: vi.fn(),
    error: null,
  }),
}))

vi.mock('../../context/CreatePostModalContext', () => ({
  useCreatePostModal: () => ({
    openCreatePost: vi.fn(),
    closeCreatePost: vi.fn(),
    subscribePostCreated: vi.fn(() => vi.fn()),
  }),
}))

// TopBar does its own data fetching on mount; stub the network away.
vi.mock('../../api/invitationsApi', () => ({
  getIncomingInvitations: vi.fn(async () => []),
  getSentInvitations: vi.fn(async () => []),
  respondToInvitation: vi.fn(),
}))

vi.mock('../../api/friendRequestsApi', () => ({
  getIncomingFriendRequests: vi.fn(async () => []),
  getSentFriendRequests: vi.fn(async () => []),
  acceptFriendRequest: vi.fn(),
  declineFriendRequest: vi.fn(),
  cancelFriendRequest: vi.fn(),
}))

vi.mock('../../api/profilesApi', () => ({
  searchProfiles: vi.fn(async () => []),
}))

function renderShell() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<div>Home content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('AppShell', () => {
  it('renders sidebar nav and routed child content', () => {
    renderShell()

    expect(screen.getByRole('link', { name: /feed/i })).toBeInTheDocument()
    expect(screen.getByText('Home content')).toBeInTheDocument()
  })

  it('opens the mobile drawer from the menu button', async () => {
    renderShell()

    // The drawer is not mounted until opened.
    expect(screen.getAllByRole('link', { name: /feed/i })).toHaveLength(1)

    await userEvent.click(screen.getByRole('button', { name: 'Open menu' }))

    // Drawer adds a second copy of the sidebar.
    expect(screen.getAllByRole('link', { name: /feed/i })).toHaveLength(2)
  })
})
