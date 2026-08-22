import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Avatar } from './ui/Avatar'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'
import { IconButton } from './ui/IconButton'
import { MoreHorizontal } from 'lucide-react'
import { updatePost, deletePost } from '../api/postsApi'
import { ApiError } from '../api/http'
import type { PostFeedItem } from '../api/postsApi'
import type { ComponentProps } from 'react'

type BadgeVariant = ComponentProps<typeof Badge>['variant']
type CardState = 'read' | 'menu-open' | 'editing' | 'confirming-delete'
type MoodOption = 'None' | 'Enjoying' | 'Frustrated' | 'Completed' | 'Need Help'

const MOOD_OPTIONS: MoodOption[] = ['None', 'Enjoying', 'Frustrated', 'Completed', 'Need Help']

function moodBadge(mood: string | null): { label: string; variant: BadgeVariant } | null {
  switch (mood) {
    case 'Enjoying':   return { label: 'Enjoying',   variant: 'enjoying'   }
    case 'NeedHelp':   return { label: 'Need Help',  variant: 'need-help'  }
    case 'Frustrated': return { label: 'Frustrated', variant: 'frustrated' }
    case 'Completed':  return { label: 'Completed',  variant: 'completed'  }
    default: return null
  }
}

function apiMoodToOption(mood: string | null): MoodOption {
  switch (mood) {
    case 'Enjoying':   return 'Enjoying'
    case 'NeedHelp':   return 'Need Help'
    case 'Frustrated': return 'Frustrated'
    case 'Completed':  return 'Completed'
    default:           return 'None'
  }
}

function moodOptionToApi(mood: MoodOption): string | null {
  if (mood === 'None') return null
  if (mood === 'Need Help') return 'NeedHelp'
  return mood
}

function formatRelativeTime(createdAt: string): string {
  const diffMs = Date.now() - new Date(createdAt).getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  if (diffMin < 60) return `${Math.max(diffMin, 1)}m ago`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH}h ago`
  return `${Math.floor(diffH / 24)}d ago`
}

interface PostCardProps {
  post: PostFeedItem
  currentUserId?: string
  onDelete?: (postId: string) => void
  onUpdate?: (post: PostFeedItem) => void
}

export function PostCard({ post, currentUserId, onDelete, onUpdate }: PostCardProps) {
  const [state, setState] = useState<CardState>('read')
  const [editText, setEditText] = useState(post.textContent)
  const [editMood, setEditMood] = useState<MoodOption>(apiMoodToOption(post.mood))
  const [actionError, setActionError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const isOwner = currentUserId != null && currentUserId === post.authorId
  const badge = moodBadge(post.mood)

  // Close menu on outside click
  useEffect(() => {
    if (state !== 'menu-open') return
    function handleMouseDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setState('read')
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [state])

  async function handleSave() {
    setActionError(null)
    setIsSaving(true)
    try {
      const updated = await updatePost(
        localStorage.getItem('playr_token') ?? '',
        post.id,
        { textContent: editText.trim(), mood: moodOptionToApi(editMood) }
      )
      onUpdate?.(updated)
      setState('read')
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Failed to update post.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    setActionError(null)
    setIsDeleting(true)
    try {
      await deletePost(localStorage.getItem('playr_token') ?? '', post.id)
      onDelete?.(post.id)
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Failed to delete post.')
      setIsDeleting(false)
    }
  }

  function openEdit() {
    setEditText(post.textContent)
    setEditMood(apiMoodToOption(post.mood))
    setActionError(null)
    setState('editing')
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to={`/profile/${post.authorUsername}`} className="shrink-0">
            <Avatar src={post.authorAvatarUrl ?? undefined} alt={post.authorDisplayName} />
          </Link>
          <Link to={`/profile/${post.authorUsername}`} className="hover:underline">
            <p className="text-sm font-semibold text-text">
              {post.authorDisplayName.toLowerCase() === post.authorUsername.toLowerCase()
                ? `@${post.authorUsername}`
                : post.authorDisplayName}
            </p>
            {post.authorDisplayName.toLowerCase() !== post.authorUsername.toLowerCase() && (
              <p className="text-xs text-muted">@{post.authorUsername}</p>
            )}
          </Link>
        </div>
        <div className="flex items-center gap-2">
          {state === 'read' && badge && <Badge variant={badge.variant}>{badge.label}</Badge>}
          {isOwner && (state === 'read' || state === 'menu-open') && (
            <div className="relative" ref={menuRef}>
              <IconButton
                aria-label="Post options"
                onClick={() => setState(state === 'menu-open' ? 'read' : 'menu-open')}
              >
                <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
              </IconButton>
              {state === 'menu-open' && (
                <div className="absolute right-0 top-10 z-10 min-w-[120px] rounded-lg border border-border bg-surface-raised shadow-lg">
                  <button
                    className="w-full px-4 py-2 text-left text-sm text-text hover:bg-border rounded-t-lg"
                    onClick={openEdit}
                  >
                    Edit
                  </button>
                  <button
                    className="w-full px-4 py-2 text-left text-sm text-frustrated hover:bg-border rounded-b-lg"
                    onClick={() => { setActionError(null); setState('confirming-delete') }}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Game */}
      <p className="text-xs font-medium text-primary">{post.gameName}</p>

      {/* Content: read / editing / confirming-delete */}
      {state === 'editing' ? (
        <div className="flex flex-col gap-3">
          {/* Mood picker */}
          <div className="flex flex-wrap gap-2">
            {MOOD_OPTIONS.map((mood) => (
              <button
                key={mood}
                type="button"
                aria-pressed={editMood === mood}
                onClick={() => setEditMood(mood)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  editMood === mood ? 'bg-primary text-white' : 'bg-surface-raised text-muted hover:text-text'
                }`}
              >
                {mood}
              </button>
            ))}
          </div>
          {/* Textarea */}
          <textarea
            aria-label="Edit post text"
            className="rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-text resize-none h-28 outline-none focus:border-primary"
            value={editText}
            maxLength={1000}
            onChange={(e) => setEditText(e.target.value)}
          />
          <span className="text-xs text-muted self-end">{editText.length} / 1000</span>
          {actionError && <p className="text-frustrated text-xs">{actionError}</p>}
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving…' : 'Save'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setState('read'); setActionError(null) }}>
              Cancel
            </Button>
          </div>
        </div>
      ) : state === 'confirming-delete' ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-text">Delete this post?</p>
          {actionError && <p className="text-frustrated text-xs">{actionError}</p>}
          <div className="flex gap-2">
            <Button
              size="sm"
              aria-label="Confirm delete"
              className="bg-frustrated hover:bg-frustrated/80 shadow-none"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting…' : 'Delete'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setState('read'); setActionError(null) }}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-text leading-relaxed">{post.textContent}</p>
      )}

      {/* Timestamp (always shown) */}
      <p className="text-xs text-muted">{formatRelativeTime(post.createdAt)}</p>
    </div>
  )
}
