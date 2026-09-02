import { describe, expect, it } from 'vitest'
import type { NotificationItem } from '../api/notificationsApi'
import { getNotificationPresentation, getNotificationTarget } from './notificationPresentation'

function notification(overrides: Partial<NotificationItem> = {}): NotificationItem {
  return {
    id: 'notification-1',
    type: 'FollowedUserPosted',
    isRead: false,
    createdAt: new Date().toISOString(),
    actor: { userId: 'user-1', username: 'anna', displayName: 'Anna', avatarUrl: null },
    postId: 'post-1',
    commentId: null,
    lfgGroupId: null,
    ...overrides,
  }
}

describe('notificationPresentation', () => {
  it('presents followed-user posts separately from mentions', () => {
    expect(getNotificationPresentation('FollowedUserPosted')).toEqual({
      messageKey: 'followedUserPosted',
      showActor: true,
    })
  })

  it('presents badge notifications without the user as actor', () => {
    expect(getNotificationPresentation('BadgeUnlocked')).toEqual({
      messageKey: 'badgeUnlocked',
      showActor: false,
    })
  })

  it('uses neutral presentation for an unknown server value', () => {
    expect(getNotificationPresentation('FutureNotification')).toEqual({
      messageKey: 'unknown',
      showActor: false,
    })
  })

  it('targets the existing post detail route', () => {
    expect(getNotificationTarget(notification())).toBe('/posts/post-1')
  })

  it('targets badge settings for badge notifications', () => {
    expect(getNotificationTarget(notification({ type: 'BadgeUnlocked', postId: null })))
      .toBe('/settings/badges')
  })
})
