import { SteamAccountSection } from '../../components/SteamAccountSection'
import { SettingsSectionHeader } from '../../components/SettingsSectionHeader'
import { useAuth } from '../../context/AuthContext'

export default function SteamAccountSettingsPage() {
  const { token } = useAuth()
  if (!token) return null

  return (
    <div className="flex flex-col gap-4 max-w-xl">
      <SettingsSectionHeader title="Account linking" />
      <SteamAccountSection token={token} />
    </div>
  )
}
