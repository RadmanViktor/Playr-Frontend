import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Avatar } from './ui/Avatar'
import { Button } from './ui/Button'
import { EmojiPickerButton } from './EmojiPickerButton'
import type { CommentItem as CommentItemType } from '../api/commentsApi'

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
}

export function CommentItem({ comment, currentUserId, onSave, onDelete }: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [text, setText] = useState(comment.textContent)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isOwner = currentUserId != null && currentUserId === comment.authorId

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
    <div className="flex gap-2">
      <Link to={`/profile/${comment.authorUsername}`} className="shrink-0">
        <Avatar src={comment.authorAvatarUrl ?? undefined} alt={comment.authorDisplayName} size="sm" />
      </Link>
      <div className="flex-1">
        <div className="rounded-lg bg-surface-raised px-3 py-2">
          <Link to={`/profile/${comment.authorUsername}`} className="block mb-1 text-xs font-semibold text-primary hover:underline">
            {comment.authorDisplayName}
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
            <p className="text-sm text-text">{comment.textContent}</p>
          )}
        </div>
        {!isEditing && (
          <div className="mt-1 flex items-center gap-3 px-1 text-xs text-muted">
            <span>{formatRelativeTime(comment.createdAt)}</span>
            {isOwner && (
              <>
                <button type="button" className="cursor-pointer hover:text-text" onClick={() => setIsEditing(true)}>
                  Edit
                </button>
                <button
                  type="button"
                  className="cursor-pointer hover:text-frustrated"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting…' : 'Delete'}
                </button>
              </>
            )}
          </div>
        )}
        {!isEditing && error && <p className="mt-1 px-1 text-frustrated text-xs">{error}</p>}
      </div>
    </div>
  )
}
