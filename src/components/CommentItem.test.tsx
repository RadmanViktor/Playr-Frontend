import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { CommentItem } from './CommentItem'
import type { CommentItem as CommentItemType } from '../api/commentsApi'

const baseComment: CommentItemType = {
  id: 'c1',
  postId: 'p1',
  authorId: 'a1',
  authorUsername: 'nexusnova',
  authorDisplayName: 'NexusNova',
  authorAvatarUrl: null,
  authorActiveBadgeType: null,
  authorActiveBadgeLevel: null,
  textContent: 'Nice post!',
  createdAt: new Date(Date.now() - 60_000).toISOString(),
  updatedAt: null,
  reactions: { counts: { like: 0, haha: 0, wow: 0, sad: 0, angry: 0 }, currentUserReaction: null },
  mentions: [],
}

function renderComment(props: Partial<React.ComponentProps<typeof CommentItem>> = {}) {
  const onSave = vi.fn()
  const onDelete = vi.fn()
  const onReact = vi.fn()
  const onRemoveReaction = vi.fn()
  render(
    <MemoryRouter>
      <CommentItem
        comment={baseComment}
        onSave={onSave}
        onDelete={onDelete}
        onReact={onReact}
        onRemoveReaction={onRemoveReaction}
        {...props}
      />
    </MemoryRouter>
  )
  return { onSave, onDelete, onReact, onRemoveReaction }
}

beforeEach(() => { vi.resetAllMocks() })

describe('CommentItem — reactions', () => {
  it('does not show the react button when currentUserId is not set', () => {
    renderComment()
    expect(screen.queryByRole('button', { name: /react to comment/i })).not.toBeInTheDocument()
  })

  it('shows the react button when currentUserId is set', () => {
    renderComment({ currentUserId: 'a2' })
    expect(screen.getByRole('button', { name: /react to comment/i })).toBeInTheDocument()
  })

  it('opens the emoji picker on click and shows all 5 reaction options', async () => {
    const user = userEvent.setup()
    renderComment({ currentUserId: 'a2' })
    await user.click(screen.getByRole('button', { name: /react to comment/i }))
    expect(screen.getByRole('button', { name: /^like$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^haha$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^wow$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^sad$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^angry$/i })).toBeInTheDocument()
  })

  it('calls onReact with the picked type', async () => {
    const user = userEvent.setup()
    const { onReact } = renderComment({ currentUserId: 'a2' })
    await user.click(screen.getByRole('button', { name: /react to comment/i }))
    await user.click(screen.getByRole('button', { name: /^like$/i }))
    await waitFor(() => expect(onReact).toHaveBeenCalledWith('c1', 'Like'))
  })

  it('calls onRemoveReaction when picking the already-active type (toggle off)', async () => {
    const user = userEvent.setup()
    const { onRemoveReaction } = renderComment({
      currentUserId: 'a2',
      comment: { ...baseComment, reactions: { counts: { like: 1, haha: 0, wow: 0, sad: 0, angry: 0 }, currentUserReaction: 'Like' } },
    })
    await user.click(screen.getByRole('button', { name: /react to comment/i }))
    await user.click(screen.getByRole('button', { name: /^like$/i }))
    await waitFor(() => expect(onRemoveReaction).toHaveBeenCalledWith('c1'))
  })

  it('calls onRemoveReaction when clicking the active reaction count chip directly', async () => {
    const user = userEvent.setup()
    const { onRemoveReaction } = renderComment({
      currentUserId: 'a2',
      comment: { ...baseComment, reactions: { counts: { like: 1, haha: 0, wow: 0, sad: 0, angry: 0 }, currentUserReaction: 'Like' } },
    })
    await user.click(screen.getByRole('button', { name: /remove like reaction/i }))
    await waitFor(() => expect(onRemoveReaction).toHaveBeenCalledWith('c1'))
  })

  it('renders per-type reaction counts', () => {
    renderComment({
      currentUserId: 'a2',
      comment: { ...baseComment, reactions: { counts: { like: 3, haha: 1, wow: 0, sad: 0, angry: 0 }, currentUserReaction: null } },
    })
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('renders guest reaction counts as non-interactive text', () => {
    renderComment({
      comment: { ...baseComment, reactions: { counts: { like: 3, haha: 0, wow: 0, sad: 0, angry: 0 }, currentUserReaction: null } },
    })

    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('shows an error message when onReact rejects', async () => {
    const user = userEvent.setup()
    const onReact = vi.fn().mockRejectedValueOnce(new Error('Failed to update reaction.'))
    renderComment({ currentUserId: 'a2', onReact })
    await user.click(screen.getByRole('button', { name: /react to comment/i }))
    await user.click(screen.getByRole('button', { name: /^like$/i }))
    expect(await screen.findByText('Failed to update reaction.')).toBeInTheDocument()
  })
})
