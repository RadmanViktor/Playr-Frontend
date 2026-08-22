import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import CreatePostPage from './CreatePostPage'
import * as gamesApi from '../api/gamesApi'
import * as postsApi from '../api/postsApi'

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { username: 'player' }, token: 'test-token' }),
}))
vi.mock('../api/gamesApi')
vi.mock('../api/postsApi')

const mockGames: gamesApi.Game[] = [
  { id: 'g1', name: 'Hollow Knight', coverImageUrl: null, genre: null },
  { id: 'g2', name: 'Elden Ring', coverImageUrl: null, genre: null },
]

beforeEach(() => {
  vi.mocked(gamesApi.getGames).mockResolvedValue(mockGames)
  vi.mocked(postsApi.createPost).mockResolvedValue({
    id: 'p1', authorId: 'a', authorUsername: 'player', authorDisplayName: 'Player',
    authorAvatarUrl: null, gameId: 'g1', gameName: 'Hollow Knight', gameCoverImageUrl: null,
    textContent: 'Hello', mood: null, createdAt: new Date().toISOString(),
  })
})

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/create-post']}>
      <Routes>
        <Route path="/create-post" element={<CreatePostPage />} />
        <Route path="/feed" element={<div>Feed page</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('CreatePostPage', () => {
  it('loads and displays games in the select', async () => {
    renderPage()
    await waitFor(() => expect(screen.getByRole('option', { name: 'Hollow Knight' })).toBeInTheDocument())
    expect(screen.getByRole('option', { name: 'Elden Ring' })).toBeInTheDocument()
  })

  it('shows validation error when submitting empty text', async () => {
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => screen.getByRole('option', { name: 'Hollow Knight' }))
    await user.click(screen.getByRole('button', { name: /post/i }))
    expect(await screen.findByText('Post text is required.')).toBeInTheDocument()
    expect(postsApi.createPost).not.toHaveBeenCalled()
  })

  it('calls createPost and navigates to feed on success', async () => {
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => screen.getByRole('option', { name: 'Hollow Knight' }))
    await user.type(screen.getByRole('textbox', { name: /post text/i }), 'Cleared the boss!')
    await user.click(screen.getByRole('button', { name: /post/i }))
    await waitFor(() => expect(screen.getByText('Feed page')).toBeInTheDocument())
    expect(postsApi.createPost).toHaveBeenCalledWith('test-token', expect.objectContaining({ textContent: 'Cleared the boss!' }))
  })

  it('shows error message on createPost failure', async () => {
    const { ApiError } = await import('../api/http')
    vi.mocked(postsApi.createPost).mockRejectedValueOnce(new ApiError(400, 'Game was not found.'))
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => screen.getByRole('option', { name: 'Hollow Knight' }))
    await user.type(screen.getByRole('textbox', { name: /post text/i }), 'Hello')
    await user.click(screen.getByRole('button', { name: /post/i }))
    await waitFor(() => expect(screen.getByText('Game was not found.')).toBeInTheDocument())
  })
})
