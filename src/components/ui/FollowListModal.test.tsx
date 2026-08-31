import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { FollowListModal } from './FollowListModal'
import { __resetBodyScrollLock } from '../../lib/useBodyScrollLock'
import * as followApi from '../../api/followApi'

vi.mock('../../api/followApi')
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ token: 'tok', user: { id: 'u1' } }),
}))

afterEach(() => {
  __resetBodyScrollLock()
  document.body.removeAttribute('style')
  vi.mocked(followApi.getFollowers).mockReset()
  vi.mocked(followApi.getFollowing).mockReset()
})

const sampleFollow: followApi.Follow = {
  userId: 'u2',
  username: 'friend',
  displayName: 'Friend',
  avatarUrl: null,
  followingSince: new Date().toISOString(),
}

function renderModal(mode: 'followers' | 'following', onClose = vi.fn()) {
  return render(
    <MemoryRouter initialEntries={['/profile/player']}>
      <Routes>
        <Route path="/profile/player" element={<FollowListModal userId="u1" mode={mode} onClose={onClose} />} />
        <Route path="/profile/:username" element={<p>Other profile page</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('FollowListModal', () => {
  it('shows followers when mode is followers', async () => {
    vi.mocked(followApi.getFollowers).mockResolvedValue([sampleFollow])
    renderModal('followers')

    await waitFor(() => expect(screen.getByText('Friend')).toBeInTheDocument())
    expect(followApi.getFollowers).toHaveBeenCalledWith('tok', 'u1')
    expect(screen.getByText('Followers')).toBeInTheDocument()
  })

  it('shows following when mode is following', async () => {
    vi.mocked(followApi.getFollowing).mockResolvedValue([sampleFollow])
    renderModal('following')

    await waitFor(() => expect(screen.getByText('Friend')).toBeInTheDocument())
    expect(followApi.getFollowing).toHaveBeenCalledWith('tok', 'u1')
    expect(screen.getByText('Following')).toBeInTheDocument()
  })

  it('shows an empty state when there are no users', async () => {
    vi.mocked(followApi.getFollowers).mockResolvedValue([])
    renderModal('followers')

    await waitFor(() => expect(screen.getByText('No users to show.')).toBeInTheDocument())
  })

  it('navigates to the clicked user profile and closes the modal', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    vi.mocked(followApi.getFollowers).mockResolvedValue([sampleFollow])
    renderModal('followers', onClose)

    await waitFor(() => screen.getByText('Friend'))
    await user.click(screen.getByText('Friend'))

    expect(onClose).toHaveBeenCalledOnce()
    expect(screen.getByText('Other profile page')).toBeInTheDocument()
  })
})
