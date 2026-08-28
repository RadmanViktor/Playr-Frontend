import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Conversation } from '../api/chatApi'
import { ChatProvider, useChat } from './ChatContext'
import { MOBILE_MEDIA_QUERY } from '../lib/useIsMobile'
import { setMatchMedia, resetMatchMedia } from '../test-setup'

vi.mock('./AuthContext', () => ({
  useAuth: () => ({ user: { id: 'me' }, token: 'token' }),
}))

vi.mock('./NotificationPreferencesContext', () => ({
  useNotificationPreferences: () => ({
    preferences: { chatSoundEnabled: false, chatBrowserNotificationsEnabled: false },
  }),
}))

vi.mock('../lib/chatHubConnection', () => ({
  connectChatHub: vi.fn(),
  disconnectChatHub: vi.fn(),
  onChatMessage: vi.fn(() => () => {}),
}))

// Stand-in so the test asserts on mounting, not on ChatWindow internals
// (which poll the API on an interval).
vi.mock('../components/ChatWindow', () => ({
  ChatWindow: ({ conversation }: { conversation: Conversation }) => (
    <div data-testid="chat-window">{conversation.otherParticipant.displayName}</div>
  ),
}))

function conversation(id: string, name: string): Conversation {
  return {
    id,
    otherParticipant: {
      userId: `u-${id}`,
      username: name.toLowerCase(),
      displayName: name,
      avatarUrl: null,
    },
    lastMessage: null,
    lastMessageAt: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  }
}

function Opener() {
  const { openConversation } = useChat()
  return (
    <button
      type="button"
      onClick={() => {
        openConversation(conversation('a', 'Ada'))
        openConversation(conversation('b', 'Bob'))
        openConversation(conversation('c', 'Cid'))
      }}
    >
      Open three
    </button>
  )
}

function renderProvider() {
  return render(
    <ChatProvider>
      <Opener />
    </ChatProvider>,
  )
}

beforeEach(() => resetMatchMedia())
afterEach(() => {
  resetMatchMedia()
  vi.clearAllMocks()
})

describe('ChatProvider window stacking', () => {
  it('renders every open chat side by side on desktop', async () => {
    setMatchMedia(MOBILE_MEDIA_QUERY, false)
    renderProvider()

    await userEvent.click(screen.getByRole('button', { name: 'Open three' }))

    await waitFor(() => expect(screen.getAllByTestId('chat-window')).toHaveLength(3))
  })

  it('renders only the most recent chat on mobile', async () => {
    setMatchMedia(MOBILE_MEDIA_QUERY, true)
    renderProvider()

    await userEvent.click(screen.getByRole('button', { name: 'Open three' }))

    await waitFor(() => expect(screen.getAllByTestId('chat-window')).toHaveLength(1))
    // Fullscreen windows stack identically, so the newest one must win.
    expect(screen.getByTestId('chat-window')).toHaveTextContent('Cid')
  })

  it('collapses to a single window when the viewport shrinks', async () => {
    setMatchMedia(MOBILE_MEDIA_QUERY, false)
    renderProvider()

    await userEvent.click(screen.getByRole('button', { name: 'Open three' }))
    await waitFor(() => expect(screen.getAllByTestId('chat-window')).toHaveLength(3))

    act(() => setMatchMedia(MOBILE_MEDIA_QUERY, true))

    await waitFor(() => expect(screen.getAllByTestId('chat-window')).toHaveLength(1))
  })
})
