import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import FeedPage from './FeedPage'
import * as postsApi from '../api/postsApi'
import * as gamesApi from '../api/gamesApi'

vi.mock('../api/postsApi')
vi.mock('../api/gamesApi')

const openCreatePost = vi.fn()

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'me', username: 'player' }, token: 'token' }),
}))

vi.mock('../context/CreatePostModalContext', () => ({
  useCreatePostModal: () => ({
    openCreatePost,
    subscribePostCreated: vi.fn(() => vi.fn()),
  }),
}))

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(postsApi.getFeed).mockResolvedValue([])
  vi.mocked(gamesApi.getGames).mockResolvedValue([])
})

describe('FeedPage', () => {
  it('opens a feed-scoped post modal from the desktop toolbar when the feed is empty', async () => {
    render(
      <MemoryRouter>
        <FeedPage />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText(/no posts yet/i)).toBeInTheDocument())
    const createPostButton = screen.getByText(/^create post$/i).closest('button')
    expect(createPostButton?.parentElement).toHaveClass('hidden', 'md:block')

    await userEvent.click(createPostButton!)

    expect(openCreatePost).toHaveBeenCalledWith('Feed')
  })
})
