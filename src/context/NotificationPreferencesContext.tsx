import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  type NotificationPreferences,
} from '../api/notificationsApi'
import { getNotificationPermission, requestNotificationPermission, type NotificationPermissionState } from '../lib/browserNotifications'
import { useAuth } from './AuthContext'

interface NotificationPreferencesContextValue {
  preferences: NotificationPreferences
  isLoading: boolean
  permission: NotificationPermissionState
  setChatSoundEnabled: (enabled: boolean) => Promise<void>
  setChatBrowserNotificationsEnabled: (enabled: boolean) => Promise<void>
}

const defaultPreferences: NotificationPreferences = {
  chatSoundEnabled: true,
  chatBrowserNotificationsEnabled: true,
}

const NotificationPreferencesContext = createContext<NotificationPreferencesContextValue | null>(null)

export function NotificationPreferencesProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth()
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences)
  const [isLoading, setIsLoading] = useState(true)
  const [permission, setPermission] = useState<NotificationPermissionState>(getNotificationPermission())

  useEffect(() => {
    if (!token) {
      setPreferences(defaultPreferences)
      setIsLoading(false)
      return
    }

    let cancelled = false
    setIsLoading(true)
    getNotificationPreferences(token)
      .then((result) => {
        if (!cancelled) setPreferences(result)
      })
      .catch(() => {
        /* keep defaults if it can't be loaded */
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [token])

  const persist = useCallback(
    async (next: NotificationPreferences) => {
      setPreferences(next)
      if (!token) return
      try {
        await updateNotificationPreferences(token, next)
      } catch {
        /* keep optimistic value; a retry will happen on next toggle/reload */
      }
    },
    [token],
  )

  const setChatSoundEnabled = useCallback(
    async (enabled: boolean) => {
      await persist({ ...preferences, chatSoundEnabled: enabled })
    },
    [persist, preferences],
  )

  const setChatBrowserNotificationsEnabled = useCallback(
    async (enabled: boolean) => {
      if (enabled) {
        const result = await requestNotificationPermission()
        setPermission(result)
        if (result !== 'granted') {
          // User denied (or browser doesn't support it) - don't enable a setting that can't work.
          await persist({ ...preferences, chatBrowserNotificationsEnabled: false })
          return
        }
      }
      await persist({ ...preferences, chatBrowserNotificationsEnabled: enabled })
    },
    [persist, preferences],
  )

  return (
    <NotificationPreferencesContext.Provider
      value={{ preferences, isLoading, permission, setChatSoundEnabled, setChatBrowserNotificationsEnabled }}
    >
      {children}
    </NotificationPreferencesContext.Provider>
  )
}

export function useNotificationPreferences(): NotificationPreferencesContextValue {
  const context = useContext(NotificationPreferencesContext)
  if (!context) {
    throw new Error('useNotificationPreferences must be used within a NotificationPreferencesProvider')
  }
  return context
}
