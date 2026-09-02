import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from './ui/Button'
import { CommentItem } from './CommentItem'
import { EmojiPickerButton } from './EmojiPickerButton'
import { MentionInput, type MentionDraft } from './MentionInput'
import { getComments, createComment, updateComment, deleteComment, setCommentReaction, removeCommentReaction } from '../api/commentsApi'
import type { CommentItem as CommentItemType, ReactionType } from '../api/commentsApi'
import { ApiError } from '../api/http'
import { useAuth } from '../context/AuthContext'

const PAGE_SIZE = 20

interface CommentsSectionProps {
  postId: string
  currentUserId?: string
  onCountChange: (delta: number) => void
  highlightCommentId?: string
}

export function CommentsSection({ postId, currentUserId, onCountChange, highlightCommentId }: CommentsSectionProps) {
  const { t } = useTranslation('componentsA')
  const { token } = useAuth()
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
  const canInteract = currentUserId != null && token != null

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
        setLoadError(err instanceof ApiError ? err.message : t('commentsSection.errors.loadFailed'))
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
      setLoadError(err instanceof ApiError ? err.message : t('commentsSection.errors.loadFailed'))
    } finally {
      setIsLoadingMore(false)
    }
  }

  async function handlePost(e: React.FormEvent) {
    e.preventDefault()
    if (!canInteract || !token) return
    const trimmed = newText.trim()
    if (!trimmed) return
    setPostError(null)
    setIsPosting(true)
    try {
      const created = await createComment(
        token,
        postId,
        trimmed,
        newMentions.map((m) => m.userId),
      )
      setComments((prev) => [...prev, created])
      setNewText('')
      setNewMentions([])
      onCountChange(1)
    } catch (err) {
      setPostError(err instanceof ApiError ? err.message : t('commentsSection.errors.postFailed'))
    } finally {
      setIsPosting(false)
    }
  }

  async function handleSave(commentId: string, textContent: string) {
    if (!canInteract || !token) return
    const updated = await updateComment(token, postId, commentId, textContent)
    setComments((prev) => prev.map((c) => (c.id === commentId ? updated : c)))
  }

  async function handleDelete(commentId: string) {
    if (!canInteract || !token) return
    await deleteComment(token, postId, commentId)
    setComments((prev) => prev.filter((c) => c.id !== commentId))
    onCountChange(-1)
  }

  async function handleReact(commentId: string, type: ReactionType) {
    if (!canInteract || !token) return
    const reactions = await setCommentReaction(token, postId, commentId, type)
    setComments((prev) => prev.map((c) => (c.id === commentId ? { ...c, reactions } : c)))
  }

  async function handleRemoveReaction(commentId: string) {
    if (!canInteract || !token) return
    const reactions = await removeCommentReaction(token, postId, commentId)
    setComments((prev) => prev.map((c) => (c.id === commentId ? { ...c, reactions } : c)))
  }

  return (
    <div className="flex flex-col gap-3 border-t border-border pt-3">
      {isLoading && <p className="text-xs text-muted">{t('commentsSection.loading')}</p>}
      {loadError && <p className="text-frustrated text-xs">{loadError}</p>}

      {!isLoading && comments.length === 0 && !loadError && (
        <p className="text-xs text-muted">{t('commentsSection.empty')}</p>
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
            currentUserId={canInteract ? currentUserId : undefined}
            onSave={handleSave}
            onDelete={handleDelete}
            onReact={handleReact}
            onRemoveReaction={handleRemoveReaction}
          />
        </div>
      ))}

      {hasMore && (
        <Button size="sm" variant="ghost" onClick={loadMore} disabled={isLoadingMore}>
          {isLoadingMore ? t('commentsSection.loadingMore') : t('commentsSection.loadMore')}
        </Button>
      )}

      {canInteract && (
        <form onSubmit={handlePost} className="flex flex-col gap-2">
          <MentionInput
            ariaLabel={t('commentsSection.writeCommentAriaLabel')}
            placeholder={t('commentsSection.writeCommentPlaceholder')}
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
            {isPosting ? t('commentsSection.posting') : t('commentsSection.commentButton')}
          </Button>
        </form>
      )}
    </div>
  )
}
