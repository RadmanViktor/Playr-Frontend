import { Bell, BellOff, Volume2, VolumeX } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNotificationPreferences } from '../context/NotificationPreferencesContext'

export function NotificationSettingsSection() {
  const { t } = useTranslation('componentsB')
  const { preferences, isLoading, permission, setChatSoundEnabled, setChatBrowserNotificationsEnabled } =
    useNotificationPreferences()

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-4">
      <h2 className="text-lg font-semibold text-text">{t('notificationSettingsSection.title')}</h2>
      <p className="text-sm text-muted">{t('notificationSettingsSection.description')}</p>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {preferences.chatSoundEnabled ? (
            <Volume2 className="h-5 w-5 text-text" aria-hidden="true" />
          ) : (
            <VolumeX className="h-5 w-5 text-muted" aria-hidden="true" />
          )}
          <div>
            <p className="text-sm font-medium text-text">{t('notificationSettingsSection.soundTitle')}</p>
            <p className="text-xs text-muted">{t('notificationSettingsSection.soundDescription')}</p>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={preferences.chatSoundEnabled}
          disabled={isLoading}
          onClick={() => setChatSoundEnabled(!preferences.chatSoundEnabled)}
          className={`relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
            preferences.chatSoundEnabled ? 'bg-primary' : 'bg-surface-raised'
          }`}
        >
          <span
            className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
              preferences.chatSoundEnabled ? 'translate-x-5' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {preferences.chatBrowserNotificationsEnabled ? (
            <Bell className="h-5 w-5 text-text" aria-hidden="true" />
          ) : (
            <BellOff className="h-5 w-5 text-muted" aria-hidden="true" />
          )}
          <div>
            <p className="text-sm font-medium text-text">{t('notificationSettingsSection.browserTitle')}</p>
            <p className="text-xs text-muted">
              {t('notificationSettingsSection.browserDescription')}
              {permission === 'denied' && (
                <span className="mt-1 block text-frustrated">
                  {t('notificationSettingsSection.browserBlocked')}
                </span>
              )}
            </p>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={preferences.chatBrowserNotificationsEnabled}
          disabled={isLoading || permission === 'denied'}
          onClick={() => setChatBrowserNotificationsEnabled(!preferences.chatBrowserNotificationsEnabled)}
          className={`relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
            preferences.chatBrowserNotificationsEnabled ? 'bg-primary' : 'bg-surface-raised'
          }`}
        >
          <span
            className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
              preferences.chatBrowserNotificationsEnabled ? 'translate-x-5' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>
    </section>
  )
}
