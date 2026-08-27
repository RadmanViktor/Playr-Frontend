export type NotificationPermissionState = NotificationPermission | 'unsupported'

export function getNotificationPermission(): NotificationPermissionState {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
  return Notification.permission
}

export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
  if (Notification.permission !== 'default') return Notification.permission
  return Notification.requestPermission()
}

export function showBrowserNotification(title: string, body: string, onClick?: () => void): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return
  if (Notification.permission !== 'granted') return

  const notification = new Notification(title, {
    body,
    icon: '/favicon.ico',
  })

  if (onClick) {
    notification.onclick = () => {
      window.focus()
      onClick()
      notification.close()
    }
  }
}
