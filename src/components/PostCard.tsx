import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { Link } from 'react-router-dom'
import { Avatar } from './ui/Avatar'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'
import { IconButton } from './ui/IconButton'
import { MoreHorizontal, Heart, MessageCircle } from 'lucide-react'
import { updatePost, deletePost, toggleLike } from '../api/postsApi'
import { ApiError } from '../api/http'
import { MediaGalleryUploadInput } from './MediaGalleryUploadInput'
import { PostMediaCarousel } from './PostMediaCarousel'
import { CommentsSection } from './CommentsSection'
import { EmojiPickerButton } from './EmojiPickerButton'
import { useAuth } from '../context/AuthContext'
import { MOOD_OPTIONS, moodOptionToApi, apiMoodToOption, type MoodOption } from '../lib/mood'
import { linkify } from '../lib/linkify'
import type { PostFeedItem } from '../api/postsApi'
import type { ComponentProps } from 'react'

type BadgeVariant = ComponentProps<typeof Badge>['variant']
type CardState = 'read' | 'menu-open' | 'editing' | 'confirming-delete'

function moodBadge(mood: string | null, t: TFunction): { label: string; variant: BadgeVariant } | null {
  switch (mood) {
    case 'Enjoying':   return { label: t('postCard.mood.enjoying'),   variant: 'enjoying'   }
    case 'NeedHelp':   return { label: t('postCard.mood.needHelp'),  variant: 'need-help'  }
    case 'Frustrated': return { label: t('postCard.mood.frustrated'), variant: 'frustrated' }
    case 'Completed':  return { label: t('postCard.mood.completed'),  variant: 'completed'  }
    default: return null
  }
}

function moodLabel(mood: string, t: TFunction): string {
  switch (mood) {
    case 'Enjoying': return t('postCard.mood.enjoying')
    case 'Need Help': return t('postCard.mood.needHelp')
    case 'Frustrated': return t('postCard.mood.frustrated')
    case 'Completed': return t('postCard.mood.completed')
    default: return t('postCard.mood.none')
  }
}

function formatRelativeTime(createdAt: string, t: TFunction): string {
  const diffMs = Date.now() - new Date(createdAt).getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  if (diffMin < 60) return t('postCard.timeAgo.minutes', { count: Math.max(diffMin, 1) })
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return t('postCard.timeAgo.hours', { count: diffH })
  return t('postCard.timeAgo.days', { count: Math.floor(diffH / 24) })
}

interface PostCardProps {
  post: PostFeedItem
  currentUserId?: string
  onDelete?: (postId: string) => void
  onUpdate?: (post: PostFeedItem) => void
  defaultCommentsOpen?: boolean
  highlightCommentId?: string
}

export function PostCard({ post, currentUserId, onDelete, onUpdate, defaultCommentsOpen = false, highlightCommentId }: PostCardProps) {
  const { t } = useTranslation('componentsA')
  const { token } = useAuth()
  const [state, setState] = useState<CardState>('read')
  const [editText, setEditText] = useState(post.textContent)
  const [editMood, setEditMood] = useState<MoodOption>(apiMoodToOption(post.mood))
  const [editMediaFiles, setEditMediaFiles] = useState<File[]>([])
  const [editMediaError, setEditMediaError] = useState<string | null>(null)
  const [removedExistingIds, setRemovedExistingIds] = useState<string[]>([])
  const [actionError, setActionError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [likesCount, setLikesCount] = useState(post.likesCount)
  const [liked, setLiked] = useState(post.likedByCurrentUser)
  const [isLiking, setIsLiking] = useState(false)
  const [commentsCount, setCommentsCount] = useState(post.commentsCount)
  const [commentsOpen, setCommentsOpen] = useState(defaultCommentsOpen)
  const menuRef = useRef<HTMLDivElement>(null)

  const isOwner = currentUserId != null && currentUserId === post.authorId
  const badge = moodBadge(post.mood, t)

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
        token ?? '',
        post.id,
        {
          textContent: editText.trim(),
          mood: moodOptionToApi(editMood),
          media: editMediaFiles,
          removeMediaIds: removedExistingIds,
        }
      )
      onUpdate?.(updated)
      setState('read')
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : t('postCard.errors.updateFailed'))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    setActionError(null)
    setIsDeleting(true)
    try {
      await deletePost(token ?? '', post.id)
      onDelete?.(post.id)
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : t('postCard.errors.deleteFailed'))
      setIsDeleting(false)
    }
  }

  function openEdit() {
    setEditText(post.textContent)
    setEditMood(apiMoodToOption(post.mood))
    setEditMediaFiles([])
    setEditMediaError(null)
    setRemovedExistingIds([])
    setActionError(null)
    setState('editing')
  }

  async function handleToggleLike() {
    if (currentUserId == null || isLiking) return
    setIsLiking(true)
    const previousLiked = liked
    const previousCount = likesCount
    setLiked(!previousLiked)
    setLikesCount(previousLiked ? previousCount - 1 : previousCount + 1)
    try {
      const result = await toggleLike(token ?? '', post.id)
      setLiked(result.liked)
      setLikesCount(result.likesCount)
    } catch {
      setLiked(previousLiked)
      setLikesCount(previousCount)
    } finally {
      setIsLiking(false)
    }
  }

  return (
    <div className="w-full max-w-5xl mx-auto rounded-xl border border-border bg-surface p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to={`/profile/${post.authorUsername}`} className="shrink-0">
            <Avatar
              src={post.authorAvatarUrl ?? undefined}
              alt={post.authorDisplayName}
              badgeType={post.authorActiveBadgeType}
              badgeLevel={post.authorActiveBadgeLevel}
            />
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
                aria-label={t('postCard.optionsAriaLabel')}
                onClick={() => setState(state === 'menu-open' ? 'read' : 'menu-open')}
              >
                <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
              </IconButton>
              {state === 'menu-open' && (
                <div className="absolute right-0 top-10 z-10 min-w-[120px] rounded-lg border border-border bg-surface-raised shadow-lg">
                  <button
                    className="w-full px-4 py-2 text-left text-sm text-text hover:bg-border rounded-t-lg cursor-pointer"
                    onClick={openEdit}
                  >
                    {t('postCard.edit')}
                  </button>
                  <button
                    className="w-full px-4 py-2 text-left text-sm text-frustrated hover:bg-border rounded-b-lg cursor-pointer"
                    onClick={() => { setActionError(null); setState('confirming-delete') }}
                  >
                    {t('postCard.delete')}
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
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors cursor-pointer ${
                  editMood === mood ? 'bg-primary text-white' : 'bg-surface-raised text-muted hover:text-text'
                }`}
              >
                {moodLabel(mood, t)}
              </button>
            ))}
          </div>
          {/* Textarea */}
          <div className="relative">
            <textarea
              aria-label="Edit post text"
              className="w-full rounded-lg border border-border bg-surface-raised px-3 py-2 pr-10 text-sm text-text resize-none h-28 outline-none focus:border-primary"
              value={editText}
              maxLength={1000}
              onChange={(e) => setEditText(e.target.value)}
            />
            <div className="absolute bottom-2 right-2">
              <EmojiPickerButton onSelect={(emoji) => setEditText((t) => t + emoji)} />
            </div>
          </div>
          <span className="text-xs text-muted self-end">{t('postCard.charCount', { count: editText.length, max: 1000 })}</span>
          <MediaGalleryUploadInput
            files={editMediaFiles}
            onFilesChange={setEditMediaFiles}
            existingMedia={post.media}
            removedExistingIds={removedExistingIds}
            onRemovedExistingIdsChange={setRemovedExistingIds}
            error={editMediaError}
            onError={setEditMediaError}
          />
          {actionError && <p className="text-frustrated text-xs">{actionError}</p>}
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              {isSaving ? t('postCard.saving') : t('postCard.save')}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setState('read'); setActionError(null) }}>
              {t('postCard.cancel')}
            </Button>
          </div>
        </div>
      ) : state === 'confirming-delete' ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-text">{t('postCard.deleteConfirm')}</p>
          {actionError && <p className="text-frustrated text-xs">{actionError}</p>}
          <div className="flex gap-2">
            <Button
              size="sm"
              aria-label={t('postCard.confirmDeleteAriaLabel')}
              className="bg-frustrated hover:bg-frustrated/80 shadow-none"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? t('postCard.deleting') : t('postCard.delete')}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setState('read'); setActionError(null) }}>
              {t('postCard.cancel')}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-text leading-relaxed whitespace-pre-wrap">{linkify(post.textContent, post.mentions)}</p>
          <PostMediaCarousel media={post.media} />
        </div>
      )}

      {/* Timestamp + likes */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted">{formatRelativeTime(post.createdAt, t)}</p>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCommentsOpen((open) => !open)}
            aria-label={commentsOpen ? t('postCard.hideCommentsAriaLabel') : t('postCard.showCommentsAriaLabel')}
            aria-pressed={commentsOpen}
            className="flex items-center gap-1.5 text-xs font-medium text-muted hover:text-text transition-colors cursor-pointer"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            {commentsCount > 0 && commentsCount}
          </button>
          <button
            onClick={handleToggleLike}
            disabled={currentUserId == null}
            aria-label={liked ? t('postCard.unlikePostAriaLabel') : t('postCard.likePostAriaLabel')}
            aria-pressed={liked}
            className={`flex items-center gap-1.5 text-xs font-medium transition-colors cursor-pointer disabled:cursor-default ${
              liked ? 'text-frustrated' : 'text-muted hover:text-frustrated'
            }`}
          >
            <Heart className="h-4 w-4" fill={liked ? 'currentColor' : 'none'} aria-hidden="true" />
            {likesCount > 0 && likesCount}
          </button>
        </div>
      </div>

      {commentsOpen && (
        <CommentsSection
          postId={post.id}
          currentUserId={currentUserId}
          onCountChange={(delta) => setCommentsCount((count) => count + delta)}
          highlightCommentId={highlightCommentId}
        />
      )}
    </div>
  )
}
