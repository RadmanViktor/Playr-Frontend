import { useTranslation } from 'react-i18next'
import { SteamAccountSection } from '../../components/SteamAccountSection'
import { SettingsSectionHeader } from '../../components/SettingsSectionHeader'
import { useAuth } from '../../context/AuthContext'

export default function SteamAccountSettingsPage() {
  const { t } = useTranslation('pagesB')
  const { token } = useAuth()
  if (!token) return null

  return (
    <div className="flex flex-col gap-4 max-w-xl">
      <SettingsSectionHeader title={t('steamAccountSettings.title')} />
      <SteamAccountSection token={token} />
    </div>
  )
}
