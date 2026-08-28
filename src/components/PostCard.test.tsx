import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import type { ReactElement } from 'react'
import { PostCard } from './PostCard'
import type { PostFeedItem } from '../api/postsApi'
import * as postsApi from '../api/postsApi'

vi.mock('../api/postsApi')

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ token: 'test-token', user: null }),
}))

const base: PostFeedItem = {
  id: 'p1', authorId: 'a1', authorUsername: 'nexusnova', authorDisplayName: 'NexusNova',
  authorAvatarUrl: null, gameId: 'g1', gameName: 'Elden Ring', gameCoverImageUrl: null,
  textContent: 'Finally beat Radahn!', mood: 'Enjoying',
  media: [],
  createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  likesCount: 0, likedByCurrentUser: false, commentsCount: 0,
}

beforeEach(() => { vi.resetAllMocks() })

// PostCard links the author avatar and name to the profile page, so every
// render needs router context.
function renderCard(ui: ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

describe('PostCard — read mode', () => {
  it('renders both names when the display name differs from the username', () => {
    renderCard(<PostCard post={{ ...base, authorDisplayName: 'Nexus Nova' }} />)
    expect(screen.getByText('Nexus Nova')).toBeInTheDocument()
    expect(screen.getByText('@nexusnova')).toBeInTheDocument()
  })

  it('shows only the handle when the display name merely repeats the username', () => {
    // base has displayName 'NexusNova' vs username 'nexusnova' - the same name,
    // so rendering both would just be noise.
    renderCard(<PostCard post={base} />)
    expect(screen.getByText('@nexusnova')).toBeInTheDocument()
    expect(screen.queryByText('NexusNova')).not.toBeInTheDocument()
  })

  it('links the author to their profile', () => {
    renderCard(<PostCard post={base} />)
    expect(screen.getAllByRole('link')[0]).toHaveAttribute('href', '/profile/nexusnova')
  })

  it('renders game name', () => {
    renderCard(<PostCard post={base} />)
    expect(screen.getByText('Elden Ring')).toBeInTheDocument()
  })

  it('renders text content', () => {
    renderCard(<PostCard post={base} />)
    expect(screen.getByText('Finally beat Radahn!')).toBeInTheDocument()
  })

  it('renders mood badge', () => {
    renderCard(<PostCard post={base} />)
    expect(screen.getByText('Enjoying')).toBeInTheDocument()
  })

  it('renders no mood badge when mood is null', () => {
    renderCard(<PostCard post={{ ...base, mood: null }} />)
    expect(screen.queryByText('Enjoying')).not.toBeInTheDocument()
  })

  it('maps NeedHelp mood to need-help badge variant', () => {
    renderCard(<PostCard post={{ ...base, mood: 'NeedHelp' }} />)
    expect(screen.getByText('Need Help')).toHaveAttribute('data-variant', 'need-help')
  })

  it('renders a relative timestamp', () => {
    renderCard(<PostCard post={base} />)
    expect(screen.getByText(/ago/i)).toBeInTheDocument()
  })
})

describe('PostCard — ... menu', () => {
  it('does not show ... button when currentUserId differs from authorId', () => {
    renderCard(<PostCard post={base} currentUserId="other-user" />)
    expect(screen.queryByRole('button', { name: /post options/i })).not.toBeInTheDocument()
  })

  it('shows ... button when currentUserId matches authorId', () => {
    renderCard(<PostCard post={base} currentUserId="a1" />)
    expect(screen.getByRole('button', { name: /post options/i })).toBeInTheDocument()
  })

  it('opens dropdown with Edit and Delete on ... click', async () => {
    const user = userEvent.setup()
    renderCard(<PostCard post={base} currentUserId="a1" />)
    await user.click(screen.getByRole('button', { name: /post options/i }))
    expect(screen.getByRole('button', { name: /^edit$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^delete$/i })).toBeInTheDocument()
  })
})

describe('PostCard — edit mode', () => {
  it('switches to editing on Edit click with pre-filled textarea', async () => {
    const user = userEvent.setup()
    renderCard(<PostCard post={base} currentUserId="a1" />)
    await user.click(screen.getByRole('button', { name: /post options/i }))
    await user.click(screen.getByRole('button', { name: /^edit$/i }))
    const textarea = screen.getByRole('textbox', { name: /edit post text/i })
    expect(textarea).toHaveValue('Finally beat Radahn!')
  })

  it('Cancel in edit mode returns to read state', async () => {
    const user = userEvent.setup()
    renderCard(<PostCard post={base} currentUserId="a1" />)
    await user.click(screen.getByRole('button', { name: /post options/i }))
    await user.click(screen.getByRole('button', { name: /^edit$/i }))
    await user.click(screen.getByRole('button', { name: /cancel/i }))
    expect(screen.getByText('Finally beat Radahn!')).toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: /edit post text/i })).not.toBeInTheDocument()
  })

  it('Save calls updatePost and calls onUpdate with result', async () => {
    const updatedPost: PostFeedItem = { ...base, textContent: 'Updated!', mood: null }
    vi.mocked(postsApi.updatePost).mockResolvedValueOnce(updatedPost)
    const onUpdate = vi.fn()
    const user = userEvent.setup()
    renderCard(<PostCard post={base} currentUserId="a1" onUpdate={onUpdate} />)
    await user.click(screen.getByRole('button', { name: /post options/i }))
    await user.click(screen.getByRole('button', { name: /^edit$/i }))
    const textarea = screen.getByRole('textbox', { name: /edit post text/i })
    await user.clear(textarea)
    await user.type(textarea, 'Updated!')
    await user.click(screen.getByRole('button', { name: /save/i }))
    await waitFor(() => expect(onUpdate).toHaveBeenCalledWith(updatedPost))
  })
})

describe('PostCard — delete confirm', () => {
  it('switches to confirming-delete on Delete click', async () => {
    const user = userEvent.setup()
    renderCard(<PostCard post={base} currentUserId="a1" />)
    await user.click(screen.getByRole('button', { name: /post options/i }))
    await user.click(screen.getByRole('button', { name: /^delete$/i }))
    expect(screen.getByText(/delete this post/i)).toBeInTheDocument()
  })

  it('Cancel in confirm mode returns to read state', async () => {
    const user = userEvent.setup()
    renderCard(<PostCard post={base} currentUserId="a1" />)
    await user.click(screen.getByRole('button', { name: /post options/i }))
    await user.click(screen.getByRole('button', { name: /^delete$/i }))
    await user.click(screen.getByRole('button', { name: /cancel/i }))
    expect(screen.queryByText(/delete this post/i)).not.toBeInTheDocument()
    expect(screen.getByText('Finally beat Radahn!')).toBeInTheDocument()
  })

  it('Delete calls deletePost and calls onDelete with postId', async () => {
    vi.mocked(postsApi.deletePost).mockResolvedValueOnce(undefined)
    const onDelete = vi.fn()
    const user = userEvent.setup()
    renderCard(<PostCard post={base} currentUserId="a1" onDelete={onDelete} />)
    await user.click(screen.getByRole('button', { name: /post options/i }))
    await user.click(screen.getByRole('button', { name: /^delete$/i }))
    await user.click(screen.getByRole('button', { name: /confirm delete/i }))
    await waitFor(() => expect(onDelete).toHaveBeenCalledWith('p1'))
  })
})
