import { useTranslation } from 'react-i18next'
import { NotificationSettingsSection } from '../../components/NotificationSettingsSection'
import { SettingsSectionHeader } from '../../components/SettingsSectionHeader'

export default function NotificationSettingsPage() {
  const { t } = useTranslation('pagesB')
  return (
    <div className="flex flex-col gap-4 max-w-xl">
      <SettingsSectionHeader title={t('notificationSettings.title')} />
      <NotificationSettingsSection />
    </div>
  )
}
