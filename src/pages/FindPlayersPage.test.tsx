import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
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
    relationshipStatus: 'None',
    pendingInvitationId: null,
  },
]

describe('FindPlayersPage', () => {
  beforeEach(() => {
    vi.mocked(profilesApi.getLookingForGamePlayers).mockResolvedValue(players)
    vi.mocked(gamesApi.getGames).mockResolvedValue([])
  })

  function renderPage() {
    // The page navigates to profiles, so it needs router context.
    return render(
      <MemoryRouter>
        <FindPlayersPage />
      </MemoryRouter>,
    )
  }

  it('shows success feedback after sending an invitation', async () => {
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => expect(screen.getByText('Nexus Nova')).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: /invite/i }))
    await user.click(screen.getByRole('button', { name: /mock send invitation/i }))

    expect(screen.getByText('Invitation sent to Nexus Nova.')).toBeInTheDocument()
    expect(screen.getByText('Invited')).toBeInTheDocument()
  })

  it('shows the looking-for-game note on a player card', async () => {
    renderPage()

    await waitFor(() => expect(screen.getByText('Nexus Nova')).toBeInTheDocument())
    expect(screen.getByText('looking for a duo partner')).toBeInTheDocument()
  })
})
