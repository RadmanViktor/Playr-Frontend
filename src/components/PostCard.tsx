import { Avatar } from './ui/Avatar'
import { Badge } from './ui/Badge'
import type { PostFeedItem } from '../api/postsApi'
import type { ComponentProps } from 'react'

type BadgeVariant = ComponentProps<typeof Badge>['variant']

function moodBadge(mood: string | null): { label: string; variant: BadgeVariant } | null {
  switch (mood) {
    case 'Enjoying': return { label: 'Enjoying', variant: 'enjoying' }
    case 'NeedHelp': return { label: 'Need Help', variant: 'need-help' }
    case 'Frustrated': return { label: 'Frustrated', variant: 'frustrated' }
    case 'Completed': return { label: 'Completed', variant: 'completed' }
    default: return null
  }
}

function formatRelativeTime(createdAt: string): string {
  const diffMs = Date.now() - new Date(createdAt).getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  if (diffMin < 60) return `${Math.max(diffMin, 1)}m ago`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH}h ago`
  return `${Math.floor(diffH / 24)}d ago`
}

export function PostCard({ post }: { post: PostFeedItem }) {
  const badge = moodBadge(post.mood)

  return (
    <div className="rounded-xl border border-border bg-surface p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar
            src={post.authorAvatarUrl ?? undefined}
            alt={post.authorDisplayName}
          />
          <div>
            <p className="text-sm font-semibold text-text">{post.authorDisplayName}</p>
            <p className="text-xs text-muted">@{post.authorUsername}</p>
          </div>
        </div>
        {badge && <Badge variant={badge.variant}>{badge.label}</Badge>}
      </div>

      <p className="text-xs font-medium text-primary">{post.gameName}</p>
      <p className="text-sm text-text leading-relaxed">{post.textContent}</p>
      <p className="text-xs text-muted">{formatRelativeTime(post.createdAt)}</p>
    </div>
  )
}
