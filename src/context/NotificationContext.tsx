import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type NotificationItem,
} from '../api/notificationsApi'
import { onNotificationReceived } from '../lib/chatHubConnection'
import { useAuth } from './AuthContext'
import { useNotificationPreferences } from './NotificationPreferencesContext'
import { playNotificationSound } from '../lib/sound'
import { showBrowserNotification } from '../lib/browserNotifications'

const PAGE_SIZE = 20

interface NotificationContextValue {
  notifications: NotificationItem[]
  unreadCount: number
  hasMore: boolean
  isLoading: boolean
  loadMore: () => Promise<void>
  markRead: (notificationId: string) => Promise<void>
  markAllRead: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextValue | null>(null)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user, token } = useAuth()
  const { preferences } = useNotificationPreferences()
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!token) {
      setNotifications([])
      setUnreadCount(0)
      setHasMore(false)
      return
    }
    let cancelled = false
    setIsLoading(true)
    getNotifications(token, 0, PAGE_SIZE)
      .then((feed) => {
        if (cancelled) return
        setNotifications(feed.items)
        setUnreadCount(feed.unreadCount)
        setHasMore(feed.hasMore)
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
        prev.some((n) => n.id === notification.id) ? prev : [notification, ...prev],
      )
      setUnreadCount((count) => count + 1)

      const title = `${notification.actor.displayName} tagged you`
      const body =
        notification.type === 'CommentMention' ? 'in a comment' : 'in a post'

      if (preferences.chatSoundEnabled) {
        playNotificationSound()
      }
      if (preferences.chatBrowserNotificationsEnabled) {
        showBrowserNotification(title, body)
      }
    })
  }, [user, preferences])

  const loadMore = useCallback(async () => {
    if (!token || isLoading) return
    setIsLoading(true)
    try {
      const feed = await getNotifications(token, notifications.length, PAGE_SIZE)
      setNotifications((prev) => [...prev, ...feed.items])
      setHasMore(feed.hasMore)
    } finally {
      setIsLoading(false)
    }
  }, [token, notifications.length, isLoading])

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

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, hasMore, isLoading, loadMore, markRead, markAllRead }}
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
