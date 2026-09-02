import type { NotificationItem } from '../api/notificationsApi'

type NotificationMessageKey =
  | 'taggedInPost'
  | 'taggedInComment'
  | 'newFollower'
  | 'followedUserPosted'
  | 'badgeUnlocked'
  | 'lfgApplicationReceived'
  | 'unknown'

export interface NotificationPresentation {
  messageKey: NotificationMessageKey
  showActor: boolean
}

export function getNotificationPresentation(type: string): NotificationPresentation {
  switch (type) {
    case 'PostMention':
      return { messageKey: 'taggedInPost', showActor: true }
    case 'CommentMention':
      return { messageKey: 'taggedInComment', showActor: true }
    case 'NewFollower':
      return { messageKey: 'newFollower', showActor: true }
    case 'FollowedUserPosted':
      return { messageKey: 'followedUserPosted', showActor: true }
    case 'BadgeUnlocked':
      return { messageKey: 'badgeUnlocked', showActor: false }
    case 'LfgApplicationReceived':
      return { messageKey: 'lfgApplicationReceived', showActor: true }
    default:
      return { messageKey: 'unknown', showActor: false }
  }
}

export function getNotificationTarget(notification: NotificationItem): string | null {
  if (notification.type === 'NewFollower') {
    return `/profile/${notification.actor.username}`
  }
  if (notification.type === 'LfgApplicationReceived') {
    return '/find-players'
  }
  if (notification.type === 'BadgeUnlocked') {
    return '/settings/badges'
  }
  if (notification.postId) {
    return notification.commentId
      ? `/posts/${notification.postId}?commentId=${notification.commentId}`
      : `/posts/${notification.postId}`
  }
  return null
}
