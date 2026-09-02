import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CreateGroupPanel } from './CreateGroupPanel'
import * as gamesApi from '../api/gamesApi'
import * as lfgGroupsApi from '../api/lfgGroupsApi'

vi.mock('../api/gamesApi')
vi.mock('../api/lfgGroupsApi')
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ token: 'test-token' }),
}))

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(gamesApi.searchExternalGames).mockResolvedValue([
    { rawgId: 1, name: 'Apex Legends', coverImageUrl: null, genre: null },
  ])
  vi.mocked(gamesApi.createGame).mockResolvedValue({
    id: 'game-1',
    name: 'Apex Legends',
    coverImageUrl: null,
    genre: null,
  })
  vi.mocked(lfgGroupsApi.createLfgGroup).mockResolvedValue({} as lfgGroupsApi.LfgGroup)
})

describe('CreateGroupPanel', () => {
  it('creates a group with age and microphone preferences', async () => {
    const user = userEvent.setup()
    const onChanged = vi.fn()
    render(<CreateGroupPanel onChanged={onChanged} />)

    await user.click(screen.getByText('Select a game'))
    await user.click(await screen.findByRole('button', { name: 'Apex Legends' }))
    await user.type(screen.getByLabelText('From'), '20')
    await user.type(screen.getByLabelText('To'), '35')
    await user.click(screen.getByRole('checkbox', { name: 'A microphone is required for the group' }))
    await user.click(screen.getByRole('button', { name: 'Create group' }))

    await waitFor(() =>
      expect(lfgGroupsApi.createLfgGroup).toHaveBeenCalledWith('test-token', {
        gameId: 'game-1',
        playersWanted: 3,
        playStyle: null,
        note: null,
        preferredMinAge: 20,
        preferredMaxAge: 35,
        microphoneRequired: true,
      }),
    )
    expect(onChanged).toHaveBeenCalledOnce()
  })

  it('rejects an invalid age range', async () => {
    const user = userEvent.setup()
    render(<CreateGroupPanel onChanged={vi.fn()} />)

    await user.click(screen.getByText('Select a game'))
    await user.click(await screen.findByRole('button', { name: 'Apex Legends' }))
    await user.type(screen.getByLabelText('From'), '40')
    await user.type(screen.getByLabelText('To'), '30')
    await user.click(screen.getByRole('button', { name: 'Create group' }))

    expect(screen.getByText('Enter ages from 13 to 99, with the lowest age first.')).toBeInTheDocument()
    expect(lfgGroupsApi.createLfgGroup).not.toHaveBeenCalled()
  })
})
