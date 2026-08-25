import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FindPlayersPage from './FindPlayersPage'
import * as profilesApi from '../api/profilesApi'

vi.mock('../api/profilesApi')
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ token: 'token' }),
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
    relationshipStatus: 'None',
  },
]

describe('FindPlayersPage', () => {
  beforeEach(() => {
    vi.mocked(profilesApi.getLookingForGamePlayers).mockResolvedValue(players)
  })

  it('shows success feedback after sending an invitation', async () => {
    const user = userEvent.setup()
    render(<FindPlayersPage />)

    await waitFor(() => expect(screen.getByText('Nexus Nova')).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: /invite/i }))
    await user.click(screen.getByRole('button', { name: /mock send invitation/i }))

    expect(screen.getByText('Invitation sent to Nexus Nova.')).toBeInTheDocument()
    expect(screen.getByText('Invited')).toBeInTheDocument()
  })
})
