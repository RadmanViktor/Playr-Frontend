import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import FindPlayersPage from './FindPlayersPage'
import * as profilesApi from '../api/profilesApi'
import * as gamesApi from '../api/gamesApi'

vi.mock('../api/profilesApi')
vi.mock('../api/gamesApi')
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ token: 'token' }),
}))
vi.mock('../context/StatusContext', () => ({
  useStatus: () => ({
    status: 'Online',
    lookingForGameId: null,
    lookingForGameName: null,
    lookingForPlayStyle: null,
    lookingForGameNote: null,
    lookingForPreferredMinAge: null,
    lookingForPreferredMaxAge: null,
    lookingForVoiceChatEnabled: false,
    updateStatus: vi.fn().mockResolvedValue(undefined),
  }),
}))
vi.mock('../components/ui/InviteModal', () => ({
  InviteModal: ({ onSent }: { onSent: () => void }) => (
    <button type="button" onClick={onSent}>
      Mock send invitation
    </button>
  ),
}))

const players: profilesApi.LookingForGamePlayer[] = [
  {
    userId: 'user-1',
    username: 'nexusnova',
    displayName: 'Nexus Nova',
    avatarUrl: null,
    lookingForGameId: 'game-1',
    lookingForGameName: 'Apex Legends',
    lookingForPlayStyle: 'Chill',
    lookingForGameNote: 'looking for a duo partner',
    preferredMinAge: 20,
    preferredMaxAge: 35,
    voiceChatEnabled: true,
    relationshipStatus: 'None',
    pendingInvitationId: null,
  },
]

describe('FindPlayersPage', () => {
  beforeEach(() => {
    vi.mocked(profilesApi.getLookingForGamePlayers).mockResolvedValue(players)
    vi.mocked(gamesApi.getGames).mockResolvedValue([])
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  function renderPage() {
    // The page navigates to profiles, so it needs router context.
    return render(
      <MemoryRouter>
        <FindPlayersPage />
      </MemoryRouter>,
    )
  }

  it('shows invitation success temporarily while keeping the request badge', async () => {
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => expect(screen.getByText('Nexus Nova')).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: /send request/i }))
    vi.useFakeTimers()
    fireEvent.click(screen.getByRole('button', { name: /mock send invitation/i }))

    expect(screen.getByText('Request sent to Nexus Nova.')).toBeInTheDocument()
    expect(screen.getByText('Request sent')).toBeInTheDocument()

    act(() => vi.advanceTimersByTime(3000))

    expect(screen.queryByText('Request sent to Nexus Nova.')).not.toBeInTheDocument()
    expect(screen.getByText('Request sent')).toBeInTheDocument()
  })

  it('shows the looking-for-game note on a player card', async () => {
    renderPage()

    await waitFor(() => expect(screen.getByText('Nexus Nova')).toBeInTheDocument())
    expect(screen.getByText('looking for a duo partner')).toBeInTheDocument()
    expect(screen.getByText('Age 20–35')).toBeInTheDocument()
    expect(screen.getByText('Mic and voice chat')).toBeInTheDocument()
  })

  it('does not show an age preference for an older API response without the new fields', async () => {
    vi.mocked(profilesApi.getLookingForGamePlayers).mockResolvedValue([
      {
        ...players[0],
        preferredMinAge: undefined,
        preferredMaxAge: undefined,
        voiceChatEnabled: undefined,
      } as unknown as profilesApi.LookingForGamePlayer,
    ])

    renderPage()

    await waitFor(() => expect(screen.getByText('Nexus Nova')).toBeInTheDocument())
    expect(screen.queryByText('Age 13–99')).not.toBeInTheDocument()
    expect(screen.queryByText('Mic and voice chat')).not.toBeInTheDocument()
  })
})
