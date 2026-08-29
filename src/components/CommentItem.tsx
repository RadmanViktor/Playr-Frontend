import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Avatar } from './ui/Avatar'
import { Button } from './ui/Button'
import { IconButton } from './ui/IconButton'
import { MoreHorizontal } from 'lucide-react'
import { EmojiPickerButton } from './EmojiPickerButton'
import { CommentReactions } from './CommentReactions'
import { linkify } from '../lib/linkify'
import type { CommentItem as CommentItemType, ReactionType } from '../api/commentsApi'

function formatRelativeTime(createdAt: string): string {
  const diffMs = Date.now() - new Date(createdAt).getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  if (diffMin < 60) return `${Math.max(diffMin, 1)}m ago`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH}h ago`
  return `${Math.floor(diffH / 24)}d ago`
}

interface CommentItemProps {
  comment: CommentItemType
  currentUserId?: string
  onSave: (commentId: string, textContent: string) => Promise<void>
  onDelete: (commentId: string) => Promise<void>
  onReact: (commentId: string, type: ReactionType) => Promise<void>
  onRemoveReaction: (commentId: string) => Promise<void>
}

export function CommentItem({ comment, currentUserId, onSave, onDelete, onReact, onRemoveReaction }: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [text, setText] = useState(comment.textContent)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reactionError, setReactionError] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const isOwner = currentUserId != null && currentUserId === comment.authorId

  useEffect(() => {
    if (!menuOpen) return
    function handleMouseDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [menuOpen])

  async function handleReact(type: ReactionType) {
    setReactionError(null)
    try {
      await onReact(comment.id, type)
    } catch (err) {
      setReactionError(err instanceof Error ? err.message : 'Failed to update reaction.')
    }
  }

  async function handleRemoveReaction() {
    setReactionError(null)
    try {
      await onRemoveReaction(comment.id)
    } catch (err) {
      setReactionError(err instanceof Error ? err.message : 'Failed to update reaction.')
    }
  }

  async function handleSave() {
    const trimmed = text.trim()
    if (!trimmed) return
    setError(null)
    setIsSaving(true)
    try {
      await onSave(comment.id, trimmed)
      setIsEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update comment.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    setError(null)
    setIsDeleting(true)
    try {
      await onDelete(comment.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete comment.')
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex-1">
      <div className="rounded-lg bg-surface-raised px-3 py-2">
        <Link to={`/profile/${comment.authorUsername}`} className="mb-4 flex items-center gap-2">
          <Avatar src={comment.authorAvatarUrl ?? undefined} alt={comment.authorDisplayName} size="sm" />
          <span className="text-xs font-semibold text-primary hover:underline">{comment.authorDisplayName}</span>
        </Link>
        {isEditing ? (
          <div className="mt-1 flex flex-col gap-2">
            <div className="relative">
              <textarea
                aria-label="Edit comment text"
                className="w-full rounded-lg border border-border bg-surface px-2 py-1 pr-10 text-sm text-text resize-none h-16 outline-none focus:border-primary"
                value={text}
                maxLength={500}
                onChange={(e) => setText(e.target.value)}
              />
              <div className="absolute bottom-1.5 right-1.5">
                <EmojiPickerButton onSelect={(emoji) => setText((t) => t + emoji)} />
              </div>
            </div>
            {error && <p className="text-frustrated text-xs">{error}</p>}
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Saving…' : 'Save'}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setIsEditing(false); setText(comment.textContent); setError(null) }}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-text">{linkify(comment.textContent, comment.mentions)}</p>
        )}
      </div>
      {!isEditing && (
        <div className="mt-1 flex items-center gap-3 px-1 text-xs text-muted">
          <span>{formatRelativeTime(comment.createdAt)}</span>
          <CommentReactions
            reactions={comment.reactions}
            canReact={currentUserId != null}
            onReact={handleReact}
            onRemoveReaction={handleRemoveReaction}
          />
          {isOwner && (
            <div className="relative" ref={menuRef}>
              <IconButton
                aria-label="Comment options"
                onClick={() => setMenuOpen((open) => !open)}
              >
                <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
              </IconButton>
              {menuOpen && (
                <div className="absolute right-0 top-7 z-10 min-w-[120px] rounded-lg border border-border bg-surface-raised shadow-lg">
                  <button
                    className="w-full px-4 py-2 text-left text-sm text-text hover:bg-border rounded-t-lg cursor-pointer"
                    onClick={() => { setIsEditing(true); setMenuOpen(false) }}
                  >
                    Edit
                  </button>
                  <button
                    className="w-full px-4 py-2 text-left text-sm text-frustrated hover:bg-border rounded-b-lg cursor-pointer disabled:opacity-60"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      {!isEditing && reactionError && <p className="mt-1 px-1 text-frustrated text-xs">{reactionError}</p>}
      {!isEditing && error && <p className="mt-1 px-1 text-frustrated text-xs">{error}</p>}
    </div>
  )
}
