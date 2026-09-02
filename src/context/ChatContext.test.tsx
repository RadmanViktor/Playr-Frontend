import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import type { Conversation } from '../api/chatApi'
import * as chatApi from '../api/chatApi'
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

vi.mock('../api/chatApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/chatApi')>()
  return {
    ...actual,
    getConversations: vi.fn().mockResolvedValue([]),
    getOrCreateConversation: vi.fn(),
  }
})

let chatMessageHandler: ((message: unknown) => void) | null = null
let invitationUpdatedHandler: ((invitation: Record<string, unknown>) => void) | null = null

vi.mock('../lib/chatHubConnection', () => ({
  connectChatHub: vi.fn(),
  disconnectChatHub: vi.fn(),
  onChatMessage: vi.fn((handler: (message: unknown) => void) => {
    chatMessageHandler = handler
    return () => {
      chatMessageHandler = null
    }
  }),
  onLfgGroupFilled: vi.fn(() => () => {}),
  onInvitationUpdated: vi.fn((handler: (invitation: Record<string, unknown>) => void) => {
    invitationUpdatedHandler = handler
    return () => {
      invitationUpdatedHandler = null
    }
  }),
}))

// Stand-in so the test asserts on mounting, not on ChatWindow internals
// (which poll the API on an interval).
vi.mock('../components/ChatWindow', () => ({
  ChatWindow: ({
    conversation,
    isMinimized,
    onToggleMinimize,
  }: {
    conversation: Conversation
    isMinimized: boolean
    onToggleMinimize: () => void
  }) => (
    <div data-testid="chat-window" data-minimized={isMinimized}>
      {conversation.otherParticipant?.displayName}
      <button type="button" onClick={onToggleMinimize}>
        Toggle {conversation.otherParticipant?.displayName}
      </button>
    </div>
  ),
}))

function conversation(id: string, name: string): Conversation {
  const other = {
    userId: `u-${id}`,
    username: name.toLowerCase(),
    displayName: name,
    avatarUrl: null,
  }
  return {
    id,
    type: 'Direct',
    title: null,
    otherParticipant: other,
    lastMessage: null,
    lastMessageAt: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    participants: [other],
    lfgGroupId: null,
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
    <MemoryRouter>
      <ChatProvider>
        <Opener />
      </ChatProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  resetMatchMedia()
  vi.mocked(chatApi.getOrCreateConversation).mockReset()
})
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

describe('ChatProvider incoming messages', () => {
  function incomingMessage(overrides: Partial<Record<string, unknown>> = {}) {
    return {
      id: 'm1',
      conversationId: 'new-conv',
      senderUserId: 'other-user',
      senderUsername: 'newuser',
      senderDisplayName: 'New User',
      senderAvatarUrl: null,
      body: 'Hello!',
      createdAt: '2024-01-01T00:00:00Z',
      readAt: null,
      ...overrides,
    }
  }

  it('auto-opens a chat window for a conversation that is not open yet', async () => {
    setMatchMedia(MOBILE_MEDIA_QUERY, false)
    renderProvider()

    act(() => {
      chatMessageHandler?.(incomingMessage())
    })

    await waitFor(() => expect(screen.getByTestId('chat-window')).toHaveTextContent('New User'))
  })

  it('un-minimizes an already-open chat window when a new message arrives', async () => {
    setMatchMedia(MOBILE_MEDIA_QUERY, false)
    renderProvider()

    await userEvent.click(screen.getByRole('button', { name: 'Open three' }))
    await waitFor(() => expect(screen.getAllByTestId('chat-window')).toHaveLength(3))

    await userEvent.click(screen.getByRole('button', { name: 'Toggle Ada' }))
    await waitFor(() =>
      expect(screen.getByText('Ada').closest('[data-testid="chat-window"]')).toHaveAttribute(
        'data-minimized',
        'true',
      ),
    )

    act(() => {
      chatMessageHandler?.(incomingMessage({ conversationId: 'a', senderUserId: 'u-a', senderDisplayName: 'Ada' }))
    })

    await waitFor(() =>
      expect(screen.getByText('Ada').closest('[data-testid="chat-window"]')).toHaveAttribute(
        'data-minimized',
        'false',
      ),
    )
  })
})

describe('ChatProvider accepted invitations', () => {
  it('opens the empty conversation for the sender after acceptance', async () => {
    const acceptedConversation = conversation('accepted', 'Recipient')
    vi.mocked(chatApi.getOrCreateConversation).mockResolvedValue(acceptedConversation)
    renderProvider()

    act(() => {
      invitationUpdatedHandler?.({
        status: 'Accepted',
        senderUserId: 'me',
        recipientUserId: 'recipient-id',
      })
    })

    await waitFor(() => expect(screen.getByTestId('chat-window')).toHaveTextContent('Recipient'))
    expect(chatApi.getOrCreateConversation).toHaveBeenCalledWith('token', 'recipient-id')
  })
})
