import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import HomePage from './HomePage'
import * as profilesApi from '../api/profilesApi'
import type { PostFeedItem } from '../api/postsApi'

vi.mock('../api/profilesApi')

const openCreatePost = vi.fn()

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'me', username: 'player' }, token: 'token' }),
}))

vi.mock('../context/CreatePostModalContext', () => ({
  useCreatePostModal: () => ({
    openCreatePost,
    closeCreatePost: vi.fn(),
    subscribePostCreated: vi.fn(() => vi.fn()),
  }),
}))

function post(id: string, text: string): PostFeedItem {
  return {
    id,
    authorId: 'me',
    authorUsername: 'player',
    authorDisplayName: 'Player One',
    authorAvatarUrl: null,
    gameId: 'g1',
    gameName: 'Hollow Knight',
    gameCoverImageUrl: null,
    textContent: text,
    mood: null,
    media: [],
    likeCount: 0,
    likedByCurrentUser: false,
    commentCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: null,
  } as unknown as PostFeedItem
}

function renderHome() {
  return render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('HomePage', () => {
  it('renders the posts returned for the current user', async () => {
    vi.mocked(profilesApi.getProfilePosts).mockResolvedValue([post('p1', 'First moment')])

    renderHome()

    expect(await screen.findByText('First moment')).toBeInTheDocument()
    expect(profilesApi.getProfilePosts).toHaveBeenCalledWith('player', 'token')
  })

  it('shows an empty state when the user has no posts', async () => {
    vi.mocked(profilesApi.getProfilePosts).mockResolvedValue([])

    renderHome()

    expect(await screen.findByText(/haven't posted anything yet/i)).toBeInTheDocument()
  })

  it('shows an error message when loading fails', async () => {
    vi.mocked(profilesApi.getProfilePosts).mockRejectedValue(new Error('boom'))

    renderHome()

    expect(await screen.findByText('Failed to load your posts.')).toBeInTheDocument()
  })

  it('opens the create post modal from the button', async () => {
    vi.mocked(profilesApi.getProfilePosts).mockResolvedValue([])

    renderHome()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Create Post' })).toBeEnabled())
    await userEvent.click(screen.getByRole('button', { name: 'Create Post' }))

    expect(openCreatePost).toHaveBeenCalledTimes(1)
  })
})
