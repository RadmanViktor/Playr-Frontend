import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
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
  const { user, token } = useAuth()
  const { preferences } = useNotificationPreferences()
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!token) {
      setNotifications([])
      setUnreadCount(0)
      return
    }
    let cancelled = false
    setIsLoading(true)
    getNotifications(token, 0, MAX_NOTIFICATIONS)
      .then((feed) => {
        if (cancelled) return
        setNotifications(feed.items.slice(0, MAX_NOTIFICATIONS))
        setUnreadCount(feed.unreadCount)
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
      setNotifications((prev) =>
        prev.some((n) => n.id === notification.id)
          ? prev
          : [notification, ...prev].slice(0, MAX_NOTIFICATIONS),
      )
      setUnreadCount((count) => count + 1)

      const title =
        notification.type === 'NewFollower'
          ? `${notification.actor.displayName} started following you`
          : notification.type === 'LfgApplicationReceived'
            ? `${notification.actor.displayName} applied to join your group`
            : `${notification.actor.displayName} tagged you`
      const body =
        notification.type === 'NewFollower' || notification.type === 'LfgApplicationReceived'
          ? ''
          : notification.type === 'CommentMention'
            ? 'in a comment'
            : 'in a post'

      if (preferences.chatSoundEnabled) {
        playNotificationSound()
      }
      if (preferences.chatBrowserNotificationsEnabled) {
        showBrowserNotification(title, body)
      }
    })
  }, [user, preferences])

  const markRead = useCallback(
    async (notificationId: string) => {
      if (!token) return
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n)),
      )
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
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
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
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
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
