import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import FeedPage from './FeedPage'
import * as postsApi from '../api/postsApi'

vi.mock('../api/postsApi')
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'a1', username: 'player', displayName: 'Player', email: 'p@p.com' }, token: 'tok', isLoading: false }),
}))

const samplePost: postsApi.PostFeedItem = {
  id: '1', authorId: 'a1', authorUsername: 'player', authorDisplayName: 'Player One',
  authorAvatarUrl: null, gameId: 'g', gameName: 'Hollow Knight', gameCoverImageUrl: null,
  textContent: 'Finally cleared it!', mood: 'Enjoying',
  createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
}

beforeEach(() => { vi.mocked(postsApi.getFeed).mockResolvedValue([samplePost]) })

function renderFeed() {
  return render(
    <MemoryRouter><Routes><Route path="/" element={<FeedPage />} /></Routes></MemoryRouter>
  )
}

describe('FeedPage', () => {
  it('renders posts from the feed', async () => {
    renderFeed()
    await waitFor(() => expect(screen.getByText('Finally cleared it!')).toBeInTheDocument())
    expect(screen.getByText('Player One')).toBeInTheDocument()
    expect(screen.getByText('Hollow Knight')).toBeInTheDocument()
  })

  it('renders empty state when feed is empty', async () => {
    vi.mocked(postsApi.getFeed).mockResolvedValueOnce([])
    renderFeed()
    await waitFor(() =>
      expect(screen.getByText(/no posts yet/i)).toBeInTheDocument()
    )
  })

  it('removes a post from the list when onDelete is called', async () => {
    const user = userEvent.setup()
    vi.mocked(postsApi.getFeed).mockResolvedValue([samplePost])
    vi.mocked(postsApi.deletePost).mockResolvedValue(undefined)
    renderFeed()
    await waitFor(() => expect(screen.getByText('Finally cleared it!')).toBeInTheDocument())
    // The ... button appears because currentUserId matches authorId ('a1')
    await user.click(screen.getByRole('button', { name: /post options/i }))
    await user.click(screen.getByRole('button', { name: /^delete$/i }))
    await user.click(screen.getByRole('button', { name: /confirm delete/i }))
    await waitFor(() => expect(screen.queryByText('Finally cleared it!')).not.toBeInTheDocument())
  })
})
