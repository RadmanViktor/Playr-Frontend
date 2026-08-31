import { NavLink } from 'react-router-dom'
import { Bell, Gamepad2, UserCog, Award, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from '../components/LanguageSwitcher'

export default function SettingsPage() {
  const { t } = useTranslation('settings')

  const settingsItems = [
    {
      to: '/settings/notifications',
      label: t('items.notifications.label'),
      description: t('items.notifications.description'),
      icon: Bell,
    },
    {
      to: '/settings/steam',
      label: t('items.steam.label'),
      description: t('items.steam.description'),
      icon: Gamepad2,
    },
    {
      to: '/settings/profile',
      label: t('items.profile.label'),
      description: t('items.profile.description'),
      icon: UserCog,
    },
    {
      to: '/settings/badges',
      label: t('items.badges.label'),
      description: t('items.badges.description'),
      icon: Award,
    },
  ]

  return (
    <div className="flex flex-col gap-4 max-w-xl">
      <h1 className="text-2xl font-bold text-text">{t('title')}</h1>

      <nav className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-2">
        {settingsItems.map(({ to, label, description, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg p-3 transition-colors ${
                isActive ? 'bg-surface-raised' : 'hover:bg-surface-raised'
              }`
            }
          >
            <Icon className="h-5 w-5 shrink-0 text-muted" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-text">{label}</p>
              <p className="text-xs text-muted">{description}</p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
          </NavLink>
        ))}
      </nav>

      <LanguageSwitcher />
    </div>
  )
}
