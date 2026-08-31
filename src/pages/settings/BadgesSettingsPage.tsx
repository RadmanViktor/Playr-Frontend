import { useTranslation } from 'react-i18next'
import { BadgeSection } from '../../components/BadgeSection'
import { SettingsSectionHeader } from '../../components/SettingsSectionHeader'
import { useAuth } from '../../context/AuthContext'

export default function BadgesSettingsPage() {
  const { t } = useTranslation('pagesB')
  const { token } = useAuth()
  if (!token) return null

  return (
    <div className="flex flex-col gap-4 max-w-xl">
      <SettingsSectionHeader title={t('badgesSettings.title')} />
      <BadgeSection token={token} />
    </div>
  )
}
