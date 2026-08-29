import { useEffect, useRef, useState } from 'react'
import { Button } from './ui/Button'
import { CommentItem } from './CommentItem'
import { EmojiPickerButton } from './EmojiPickerButton'
import { MentionInput, type MentionDraft } from './MentionInput'
import { getComments, createComment, updateComment, deleteComment, setCommentReaction, removeCommentReaction } from '../api/commentsApi'
import type { CommentItem as CommentItemType, ReactionType } from '../api/commentsApi'
import { ApiError } from '../api/http'

const PAGE_SIZE = 20

interface CommentsSectionProps {
  postId: string
  currentUserId?: string
  onCountChange: (delta: number) => void
  highlightCommentId?: string
}

export function CommentsSection({ postId, currentUserId, onCountChange, highlightCommentId }: CommentsSectionProps) {
  const [comments, setComments] = useState<CommentItemType[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [newText, setNewText] = useState('')
  const [newMentions, setNewMentions] = useState<MentionDraft[]>([])
  const [isPosting, setIsPosting] = useState(false)
  const [postError, setPostError] = useState<string | null>(null)
  const [scrolledToHighlight, setScrolledToHighlight] = useState(false)
  const [isHighlightFlashing, setIsHighlightFlashing] = useState(false)
  const commentRefs = useRef(new Map<string, HTMLDivElement>())

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

  // If we're deep-linking to a specific comment (e.g. from a mention notification),
  // keep loading pages until it shows up or we run out of comments to load.
  useEffect(() => {
    if (!highlightCommentId || isLoading || scrolledToHighlight) return
    const alreadyLoaded = comments.some((c) => c.id === highlightCommentId)
    if (alreadyLoaded) return
    if (!hasMore || isLoadingMore) return
    loadMore()
  }, [highlightCommentId, comments, hasMore, isLoading, isLoadingMore, scrolledToHighlight])

  useEffect(() => {
    if (!highlightCommentId || scrolledToHighlight) return
    const target = commentRefs.current.get(highlightCommentId)
    if (!target) return
    target.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setScrolledToHighlight(true)
    setIsHighlightFlashing(true)
    const timer = setTimeout(() => setIsHighlightFlashing(false), 2000)
    return () => clearTimeout(timer)
  }, [highlightCommentId, comments, scrolledToHighlight])

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
      const created = await createComment(
        localStorage.getItem('playr_token') ?? '',
        postId,
        trimmed,
        newMentions.map((m) => m.userId),
      )
      setComments((prev) => [...prev, created])
      setNewText('')
      setNewMentions([])
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

  async function handleReact(commentId: string, type: ReactionType) {
    const reactions = await setCommentReaction(localStorage.getItem('playr_token') ?? '', postId, commentId, type)
    setComments((prev) => prev.map((c) => (c.id === commentId ? { ...c, reactions } : c)))
  }

  async function handleRemoveReaction(commentId: string) {
    const reactions = await removeCommentReaction(localStorage.getItem('playr_token') ?? '', postId, commentId)
    setComments((prev) => prev.map((c) => (c.id === commentId ? { ...c, reactions } : c)))
  }

  return (
    <div className="flex flex-col gap-3 border-t border-border pt-3">
      {isLoading && <p className="text-xs text-muted">Loading comments…</p>}
      {loadError && <p className="text-frustrated text-xs">{loadError}</p>}

      {!isLoading && comments.length === 0 && !loadError && (
        <p className="text-xs text-muted">No comments yet.</p>
      )}

      {comments.map((comment) => (
        <div
          key={comment.id}
          ref={(el) => {
            if (el) commentRefs.current.set(comment.id, el)
            else commentRefs.current.delete(comment.id)
          }}
          className={`flex rounded-lg transition-colors duration-1000 ${
            highlightCommentId === comment.id && isHighlightFlashing ? 'bg-primary/10' : ''
          }`}
        >
          <CommentItem
            comment={comment}
            currentUserId={currentUserId}
            onSave={handleSave}
            onDelete={handleDelete}
            onReact={handleReact}
            onRemoveReaction={handleRemoveReaction}
          />
        </div>
      ))}

      {hasMore && (
        <Button size="sm" variant="ghost" onClick={loadMore} disabled={isLoadingMore}>
          {isLoadingMore ? 'Loading…' : 'Load more comments'}
        </Button>
      )}

      {currentUserId != null && (
        <form onSubmit={handlePost} className="flex flex-col gap-2">
          <MentionInput
            ariaLabel="Write a comment"
            placeholder="Write a comment…"
            className="w-full rounded-lg border border-border bg-surface-raised px-3 py-2 pr-10 text-sm text-text resize-none h-16 outline-none focus:border-primary"
            value={newText}
            mentions={newMentions}
            maxLength={500}
            onChange={(value, mentions) => {
              setNewText(value)
              setNewMentions(mentions)
            }}
            rightSlot={
              <div className="absolute bottom-2 right-2">
                <EmojiPickerButton onSelect={(emoji) => setNewText((t) => t + emoji)} />
              </div>
            }
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
