import { NotificationSettingsSection } from '../../components/NotificationSettingsSection'
import { SettingsSectionHeader } from '../../components/SettingsSectionHeader'

export default function NotificationSettingsPage() {
  return (
    <div className="flex flex-col gap-4 max-w-xl">
      <SettingsSectionHeader title="Notifications" />
      <NotificationSettingsSection />
    </div>
  )
}
