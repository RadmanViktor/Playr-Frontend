import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface SettingsSectionHeaderProps {
  title: string
}

export function SettingsSectionHeader({ title }: SettingsSectionHeaderProps) {
  const { t } = useTranslation('componentsB')
  return (
    <div className="flex items-center gap-2">
      <Link
        to="/settings"
        aria-label={t('settingsSectionHeader.backToSettingsAriaLabel')}
        className="rounded-lg p-1 text-muted hover:bg-surface-raised hover:text-text"
      >
        <ArrowLeft className="h-5 w-5" aria-hidden="true" />
      </Link>
      <h1 className="text-2xl font-bold text-text">{title}</h1>
    </div>
  )
}
