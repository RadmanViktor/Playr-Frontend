import { useEffect, useState } from 'react'
import { Button } from './ui/Button'
import { CommentItem } from './CommentItem'
import { getComments, createComment, updateComment, deleteComment } from '../api/commentsApi'
import type { CommentItem as CommentItemType } from '../api/commentsApi'
import { ApiError } from '../api/http'

const PAGE_SIZE = 20

interface CommentsSectionProps {
  postId: string
  currentUserId?: string
  onCountChange: (delta: number) => void
}

export function CommentsSection({ postId, currentUserId, onCountChange }: CommentsSectionProps) {
  const [comments, setComments] = useState<CommentItemType[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [newText, setNewText] = useState('')
  const [isPosting, setIsPosting] = useState(false)
  const [postError, setPostError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setLoadError(null)
    getComments(postId, 0, PAGE_SIZE)
      .then((result) => {
        if (cancelled) return
        setComments(result.items)
        setHasMore(result.hasMore)
      })
      .catch((err) => {
        if (cancelled) return
        setLoadError(err instanceof ApiError ? err.message : 'Failed to load comments.')
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => { cancelled = true }
  }, [postId])

  async function loadMore() {
    setIsLoadingMore(true)
    try {
      const result = await getComments(postId, comments.length, PAGE_SIZE)
      setComments((prev) => [...prev, ...result.items])
      setHasMore(result.hasMore)
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Failed to load comments.')
    } finally {
      setIsLoadingMore(false)
    }
  }

  async function handlePost(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = newText.trim()
    if (!trimmed) return
    setPostError(null)
    setIsPosting(true)
    try {
      const created = await createComment(localStorage.getItem('playr_token') ?? '', postId, trimmed)
      setComments((prev) => [...prev, created])
      setNewText('')
      onCountChange(1)
    } catch (err) {
      setPostError(err instanceof ApiError ? err.message : 'Failed to post comment.')
    } finally {
      setIsPosting(false)
    }
  }

  async function handleSave(commentId: string, textContent: string) {
    const updated = await updateComment(localStorage.getItem('playr_token') ?? '', postId, commentId, textContent)
    setComments((prev) => prev.map((c) => (c.id === commentId ? updated : c)))
  }

  async function handleDelete(commentId: string) {
    await deleteComment(localStorage.getItem('playr_token') ?? '', postId, commentId)
    setComments((prev) => prev.filter((c) => c.id !== commentId))
    onCountChange(-1)
  }

  return (
    <div className="flex flex-col gap-3 border-t border-border pt-3">
      {isLoading && <p className="text-xs text-muted">Loading comments…</p>}
      {loadError && <p className="text-frustrated text-xs">{loadError}</p>}

      {!isLoading && comments.length === 0 && !loadError && (
        <p className="text-xs text-muted">No comments yet.</p>
      )}

      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          currentUserId={currentUserId}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      ))}

      {hasMore && (
        <Button size="sm" variant="ghost" onClick={loadMore} disabled={isLoadingMore}>
          {isLoadingMore ? 'Loading…' : 'Load more comments'}
        </Button>
      )}

      {currentUserId != null && (
        <form onSubmit={handlePost} className="flex flex-col gap-2">
          <textarea
            aria-label="Write a comment"
            placeholder="Write a comment…"
            className="rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-text resize-none h-16 outline-none focus:border-primary"
            value={newText}
            maxLength={500}
            onChange={(e) => setNewText(e.target.value)}
          />
          {postError && <p className="text-frustrated text-xs">{postError}</p>}
          <Button type="submit" size="sm" disabled={isPosting || newText.trim().length === 0} className="self-end mt-1">
            {isPosting ? 'Posting…' : 'Comment'}
          </Button>
        </form>
      )}
    </div>
  )
}
