import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { Sidebar } from './Sidebar'

const authState = vi.hoisted(() => ({
  user: { id: '1', email: 'a@b.c', username: 'PlayerOne', displayName: null } as {
    id: string
    email: string
    username: string
    displayName: string | null
  } | null,
}))

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: authState.user,
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
    lookingForGameNote: null,
    isLoading: false,
    updateStatus: vi.fn(),
  }),
}))

// hoisted so the mock factory (which vitest lifts above imports) can read it
const chatState = vi.hoisted(() => ({ hasUnread: false }))

vi.mock('../../context/ChatContext', () => ({
  useChat: () => ({
    hasUnread: chatState.hasUnread,
    unreadConversationIds: new Set<string>(),
    openChatWithUser: vi.fn(),
    openConversation: vi.fn(),
    closeChat: vi.fn(),
    error: null,
  }),
}))

function renderSidebar(props: { onNavigate?: () => void } = {}) {
  return render(
    <MemoryRouter>
      <Sidebar {...props} />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  authState.user = { id: '1', email: 'a@b.c', username: 'PlayerOne', displayName: null }
  chatState.hasUnread = false
})

describe('Sidebar', () => {
  it('renders primary nav links', () => {
    renderSidebar()
    expect(screen.getByRole('link', { name: /feed/i })).toHaveAttribute('href', '/feed')
    expect(screen.getByRole('link', { name: /find players/i })).toHaveAttribute('href', '/find-players')
    expect(screen.getByRole('link', { name: /chats/i })).toHaveAttribute('href', '/chats')
    expect(screen.getByRole('link', { name: /friends/i })).toHaveAttribute('href', '/friends')
  })

  it('hides protected navigation from guests', () => {
    authState.user = null
    renderSidebar()

    expect(screen.queryByRole('link', { name: /feed/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /find players/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /chats/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /friends/i })).not.toBeInTheDocument()
  })

  it('does not render the create-post action', () => {
    renderSidebar()
    expect(screen.queryByRole('button', { name: /create post/i })).not.toBeInTheDocument()
  })

  it('shows the current username', () => {
    renderSidebar()
    expect(screen.getByText('PlayerOne')).toBeInTheDocument()
  })

  it('hides the unread badge when there are no unread chats', () => {
    renderSidebar()
    expect(screen.queryByLabelText('Unread messages')).not.toBeInTheDocument()
  })

  it('marks the Chats link when messages are unread', () => {
    chatState.hasUnread = true
    renderSidebar()
    expect(screen.getByLabelText('Unread messages')).toBeInTheDocument()
  })

  it('calls onNavigate when a nav link is followed', async () => {
    const onNavigate = vi.fn()
    renderSidebar({ onNavigate })

    // AppShell relies on this to close the mobile drawer after navigating.
    await userEvent.click(screen.getByRole('link', { name: /find players/i }))

    expect(onNavigate).toHaveBeenCalled()
  })
})
