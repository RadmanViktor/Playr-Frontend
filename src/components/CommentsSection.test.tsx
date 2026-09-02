import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { CommentsSection } from './CommentsSection'
import * as commentsApi from '../api/commentsApi'
import type { CommentItem, PagedComments } from '../api/commentsApi'

vi.mock('../api/commentsApi')

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ token: 'test-token' }),
}))

vi.mock('../api/friendsApi', () => ({
  getFriends: vi.fn(async () => []),
}))

const sampleComment: CommentItem = {
  id: 'c1',
  postId: 'p1',
  authorId: 'a1',
  authorUsername: 'nexusnova',
  authorDisplayName: 'NexusNova',
  authorAvatarUrl: null,
  authorActiveBadgeType: null,
  authorActiveBadgeLevel: null,
  textContent: 'Nice post!',
  createdAt: new Date().toISOString(),
  updatedAt: null,
  reactions: { counts: { like: 0, haha: 0, wow: 0, sad: 0, angry: 0 }, currentUserReaction: null },
  mentions: [],
}

const pagedComments: PagedComments = { items: [sampleComment], totalCount: 1, hasMore: false }

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(commentsApi.getComments).mockResolvedValue(pagedComments)
})

function renderSection(currentUserId?: string) {
  const onCountChange = vi.fn()
  render(
    <MemoryRouter>
      <CommentsSection postId="p1" currentUserId={currentUserId} onCountChange={onCountChange} />
    </MemoryRouter>
  )
  return { onCountChange }
}

describe('CommentsSection — reactions', () => {
  it('reacting to a comment calls setCommentReaction and updates displayed reactions', async () => {
    const updatedReactions = { counts: { like: 1, haha: 0, wow: 0, sad: 0, angry: 0 }, currentUserReaction: 'Like' as const }
    vi.mocked(commentsApi.setCommentReaction).mockResolvedValueOnce(updatedReactions)

    const user = userEvent.setup()
    renderSection('a2')
    await screen.findByText('Nice post!')

    await user.click(screen.getByRole('button', { name: /react to comment/i }))
    await user.click(screen.getByRole('button', { name: /^like$/i }))

    await waitFor(() => expect(commentsApi.setCommentReaction).toHaveBeenCalledWith('test-token', 'p1', 'c1', 'Like'))
    expect(await screen.findByText('1')).toBeInTheDocument()
  })

  it('removing a reaction calls removeCommentReaction and updates displayed reactions', async () => {
    vi.mocked(commentsApi.getComments).mockResolvedValue({
      items: [{ ...sampleComment, reactions: { counts: { like: 1, haha: 0, wow: 0, sad: 0, angry: 0 }, currentUserReaction: 'Like' } }],
      totalCount: 1,
      hasMore: false,
    })
    vi.mocked(commentsApi.removeCommentReaction).mockResolvedValueOnce({
      counts: { like: 0, haha: 0, wow: 0, sad: 0, angry: 0 },
      currentUserReaction: null,
    })

    const user = userEvent.setup()
    renderSection('a2')
    await screen.findByText('Nice post!')

    await user.click(screen.getByRole('button', { name: /react to comment/i }))
    await user.click(screen.getByRole('button', { name: /^like$/i }))

    await waitFor(() => expect(commentsApi.removeCommentReaction).toHaveBeenCalledWith('test-token', 'p1', 'c1'))
  })
})
