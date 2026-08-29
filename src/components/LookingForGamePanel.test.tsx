import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LookingForGamePanel } from './LookingForGamePanel'
import * as gamesApi from '../api/gamesApi'
import type { ProfileStatus } from '../api/profilesApi'

vi.mock('../api/gamesApi')

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ token: null, user: null, isLoading: false, login: vi.fn(), register: vi.fn(), logout: vi.fn() }),
}))

const updateStatus = vi.fn().mockResolvedValue(undefined)
const statusState = vi.hoisted(() => ({
  status: 'Online' as ProfileStatus,
  lookingForGameId: null as string | null,
  lookingForGameName: null as string | null,
  lookingForPlayStyle: null as string | null,
  lookingForGameNote: null as string | null,
}))

vi.mock('../context/StatusContext', () => ({
  useStatus: () => ({ ...statusState, updateStatus }),
}))

const games: gamesApi.Game[] = [
  { id: 'game-1', name: 'Apex Legends', coverImageUrl: null, genre: null },
]

beforeEach(() => {
  vi.mocked(gamesApi.getGames).mockResolvedValue(games)
  statusState.status = 'Online'
  statusState.lookingForGameId = null
  statusState.lookingForGameName = null
  statusState.lookingForPlayStyle = null
  statusState.lookingForGameNote = null
})

afterEach(() => {
  updateStatus.mockClear()
})

describe('LookingForGamePanel', () => {
  it('starts looking for a game with a game, play style and note', async () => {
    const user = userEvent.setup()
    const onChanged = vi.fn()
    render(<LookingForGamePanel onChanged={onChanged} />)

    await user.click(screen.getByRole('button', { name: 'Make me available!' }))

    await waitFor(() => expect(screen.getByText('Select a game')).toBeInTheDocument())
    await user.click(screen.getByText('Select a game'))
    await user.click(screen.getByRole('button', { name: 'Apex Legends' }))
    await user.click(screen.getByRole('button', { name: 'Competitive' }))
    await user.type(screen.getByPlaceholderText('Anything specific?'), 'need a 4th')
    await user.click(screen.getByRole('button', { name: 'Make me available!' }))

    await waitFor(() =>
      expect(updateStatus).toHaveBeenCalledWith('LookingForGame', 'game-1', 'Competitive', 'need a 4th'),
    )
    expect(onChanged).toHaveBeenCalled()
  })

  it('shows an error when starting without a game and play style', async () => {
    const user = userEvent.setup()
    render(<LookingForGamePanel onChanged={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Make me available!' }))
    await user.click(screen.getByRole('button', { name: 'Make me available!' }))

    expect(screen.getByText('Choose a game and a play style.')).toBeInTheDocument()
    expect(updateStatus).not.toHaveBeenCalled()
  })

  it('shows the active search and stops it', async () => {
    statusState.status = 'LookingForGame'
    statusState.lookingForGameId = 'game-1'
    statusState.lookingForGameName = 'Apex Legends'
    statusState.lookingForPlayStyle = 'Competitive'
    statusState.lookingForGameNote = 'need a 4th'

    const user = userEvent.setup()
    const onChanged = vi.fn()
    render(<LookingForGamePanel onChanged={onChanged} />)

    expect(screen.getByText('Apex Legends')).toBeInTheDocument()
    expect(screen.getByText('need a 4th')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Stop showing me' }))

    await waitFor(() => expect(updateStatus).toHaveBeenCalledWith('Online', null, null, null))
    expect(onChanged).toHaveBeenCalled()
  })
})
