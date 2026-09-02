import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification as deleteNotificationApi,
  clearAllNotifications as clearAllNotificationsApi,
  type NotificationItem,
} from '../api/notificationsApi'
import { onNotificationReceived } from '../lib/chatHubConnection'
import { useAuth } from './AuthContext'
import { useNotificationPreferences } from './NotificationPreferencesContext'
import { playNotificationSound } from '../lib/sound'
import { showBrowserNotification } from '../lib/browserNotifications'
import { getNotificationPresentation, getNotificationTarget } from '../lib/notificationPresentation'
import { BadgeUnlockCelebration } from '../components/ui/BadgeUnlockCelebration'

const MAX_NOTIFICATIONS = 10

interface NotificationContextValue {
  notifications: NotificationItem[]
  unreadCount: number
  isLoading: boolean
  markRead: (notificationId: string) => Promise<void>
  markAllRead: () => Promise<void>
  deleteNotification: (notificationId: string) => Promise<void>
  clearAllNotifications: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextValue | null>(null)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation('layout')
  const navigate = useNavigate()
  const { user, token } = useAuth()
  const { preferences } = useNotificationPreferences()
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const notificationsRef = useRef<NotificationItem[]>([])
  const deletedNotificationIdsRef = useRef(new Set<string>())
  const ignorePendingFeedRef = useRef(false)
  const markAllReadPendingFeedRef = useRef(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const activeBadgeUnlock = notifications.find(
    (notification) => notification.type === 'BadgeUnlocked' && !notification.isRead && notification.badgeType,
  )

  useEffect(() => {
    if (!token) {
      notificationsRef.current = []
      deletedNotificationIdsRef.current.clear()
      ignorePendingFeedRef.current = false
      markAllReadPendingFeedRef.current = false
      setNotifications([])
      setUnreadCount(0)
      return
    }
    let cancelled = false
    setIsLoading(true)
    getNotifications(token, 0, MAX_NOTIFICATIONS)
      .then((feed) => {
        if (cancelled || ignorePendingFeedRef.current) return
        const currentById = new Map(
          notificationsRef.current.map((notification) => [notification.id, notification]),
        )
        const fetchedIds = new Set(feed.items.map((notification) => notification.id))
        const liveNotifications = notificationsRef.current.filter(
          (notification) => !fetchedIds.has(notification.id),
        )
        const fetchedNotifications = feed.items
          .filter((notification) => !deletedNotificationIdsRef.current.has(notification.id))
          .map((notification) => {
            const current = currentById.get(notification.id) ?? notification
            return markAllReadPendingFeedRef.current ? { ...current, isRead: true } : current
          })
        const merged = [...liveNotifications, ...fetchedNotifications].slice(0, MAX_NOTIFICATIONS)
        notificationsRef.current = merged
        setNotifications(merged)
        const locallyResolvedUnread = feed.items.filter((notification) =>
          !notification.isRead && (
            deletedNotificationIdsRef.current.has(notification.id) ||
            currentById.get(notification.id)?.isRead
          ),
        ).length
        setUnreadCount(markAllReadPendingFeedRef.current
          ? 0
          : Math.max(0, feed.unreadCount - locallyResolvedUnread) +
            liveNotifications.filter((notification) => !notification.isRead).length)
        markAllReadPendingFeedRef.current = false
      })
      .catch(() => {
        /* keep empty state; the dropdown can be retried by reopening */
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [token])

  useEffect(() => {
    if (!user) return

    return onNotificationReceived((notification) => {
      if (notificationsRef.current.some((item) => item.id === notification.id)) return
      const merged = [notification, ...notificationsRef.current].slice(0, MAX_NOTIFICATIONS)
      notificationsRef.current = merged
      setNotifications(merged)
      setUnreadCount((count) => count + 1)

      const presentation = getNotificationPresentation(notification.type)
      const message = t(`topBar.notifications.${presentation.messageKey}`)
      const title = presentation.showActor
        ? `${notification.actor.displayName} ${message}`
        : message
      const target = getNotificationTarget(notification)

      if (preferences.chatSoundEnabled) {
        playNotificationSound()
      }
      if (preferences.chatBrowserNotificationsEnabled) {
        showBrowserNotification(title, '', target ? () => navigate(target) : undefined)
      }
    })
  }, [user, preferences, navigate, t])

  const markRead = useCallback(
    async (notificationId: string) => {
      if (!token) return
      const updated = notificationsRef.current.map((notification) =>
        notification.id === notificationId ? { ...notification, isRead: true } : notification,
      )
      notificationsRef.current = updated
      setNotifications(updated)
      setUnreadCount((count) => Math.max(0, count - 1))
      try {
        await markNotificationRead(token, notificationId)
      } catch {
        /* optimistic update stands; a reload will resync if this failed */
      }
    },
    [token],
  )

  const markAllRead = useCallback(async () => {
    if (!token) return
    markAllReadPendingFeedRef.current = true
    const updated = notificationsRef.current.map((notification) => ({ ...notification, isRead: true }))
    notificationsRef.current = updated
    setNotifications(updated)
    setUnreadCount(0)
    try {
      await markAllNotificationsRead(token)
    } catch {
      /* optimistic update stands; a reload will resync if this failed */
    }
  }, [token])

  const deleteNotification = useCallback(
    async (notificationId: string) => {
      if (!token) return
      const removed = notifications.find((n) => n.id === notificationId)
      deletedNotificationIdsRef.current.add(notificationId)
      const updated = notificationsRef.current.filter((notification) => notification.id !== notificationId)
      notificationsRef.current = updated
      setNotifications(updated)
      if (removed && !removed.isRead) {
        setUnreadCount((count) => Math.max(0, count - 1))
      }
      try {
        await deleteNotificationApi(token, notificationId)
      } catch {
        /* optimistic update stands; a reload will resync if this failed */
      }
    },
    [token, notifications],
  )

  const clearAllNotifications = useCallback(async () => {
    if (!token) return
    ignorePendingFeedRef.current = true
    notificationsRef.current = []
    setNotifications([])
    setUnreadCount(0)
    try {
      await clearAllNotificationsApi(token)
    } catch {
      /* optimistic update stands; a reload will resync if this failed */
    }
  }, [token])

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        markRead,
        markAllRead,
        deleteNotification,
        clearAllNotifications,
      }}
    >
      {children}
      {activeBadgeUnlock?.badgeType && (
        <BadgeUnlockCelebration
          key={activeBadgeUnlock.id}
          badgeType={activeBadgeUnlock.badgeType}
          onClose={() => void markRead(activeBadgeUnlock.id)}
        />
      )}
    </NotificationContext.Provider>
  )
}

export function useNotifications(): NotificationContextValue {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}
