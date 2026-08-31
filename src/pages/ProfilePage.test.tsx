import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import ProfilePage from './ProfilePage'
import * as profilesApi from '../api/profilesApi'

const logoutMock = vi.fn()

vi.mock('../api/profilesApi')
vi.mock('../api/postsApi', () => ({ getFeed: vi.fn(), createPost: vi.fn(), updatePost: vi.fn(), deletePost: vi.fn(), getProfilePosts: vi.fn() }))
vi.mock('../api/friendRequestsApi', () => ({
  sendFriendRequest: vi.fn(),
  cancelFriendRequest: vi.fn(),
  getSentFriendRequests: vi.fn().mockResolvedValue([]),
}))
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'u1', username: 'player', displayName: 'Player', email: 'p@p.com' },
    token: 'tok',
    isLoading: false,
    logout: logoutMock,
  }),
}))
vi.mock('../context/ChatContext', () => ({
  useChat: () => ({
    openChatWithUser: vi.fn(),
    openConversation: vi.fn(),
    closeChat: vi.fn(),
    error: null,
  }),
}))
vi.mock('../context/CreatePostModalContext', () => ({
  useCreatePostModal: () => ({
    openCreatePost: vi.fn(),
    closeCreatePost: vi.fn(),
    subscribePostCreated: vi.fn(() => () => {}),
  }),
}))

const profile: profilesApi.ProfileData = {
  userId: 'u1', username: 'player', displayName: 'Player One', bio: 'My bio',
  avatarUrl: null, coverImageUrl: null, region: 'EU', languages: [], platforms: ['PC'], genres: [],
  externalLinks: {}, status: 'Online' as const, lookingForGameId: null, lookingForGameName: null, lookingForPlayStyle: null, lookingForGameNote: null,
  typicalPlayTimes: [], hasCompletedOnboarding: true,
  createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  relationshipStatus: null, pendingInvitationId: null, activeBadgeType: null, activeBadgeLevel: null,
}

beforeEach(async () => {
  logoutMock.mockClear()
  vi.mocked(profilesApi.getProfile).mockResolvedValue(profile)
  vi.mocked(profilesApi.getProfilePosts).mockResolvedValue([])
  vi.mocked(profilesApi.getPlayingNow).mockResolvedValue([])
})

function renderProfile(username = 'player') {
  return render(
    <MemoryRouter initialEntries={[`/profile/${username}`]}>
      <Routes>
        <Route path="/profile/:username" element={<ProfilePage />} />
        <Route path="/settings" element={<p>Settings page</p>} />
        <Route path="/login" element={<p>Login page</p>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('ProfilePage', () => {
  it('renders the profile header with displayName', async () => {
    renderProfile()
    await waitFor(() => expect(screen.getByText('Player One')).toBeInTheDocument())
  })

  it('shows not found message on 404', async () => {
    const { ApiError } = await import('../api/http')
    vi.mocked(profilesApi.getProfile).mockRejectedValueOnce(new ApiError(404, 'Profile was not found.'))
    renderProfile('nobody')
    await waitFor(() => expect(screen.getByText(/not found/i)).toBeInTheDocument())
  })
})
