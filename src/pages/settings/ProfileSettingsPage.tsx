import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { EditProfileForm } from '../../components/EditProfileForm'
import { SettingsSectionHeader } from '../../components/SettingsSectionHeader'
import { getProfile, type ProfileData } from '../../api/profilesApi'
import { useAuth } from '../../context/AuthContext'
import { useStatus } from '../../context/StatusContext'

export default function ProfileSettingsPage() {
  const { t } = useTranslation('pagesB')
  const { user, token } = useAuth()
  const { setProfileSnapshot } = useStatus()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    getProfile(user.username)
      .then(setProfile)
      .finally(() => setIsLoading(false))
  }, [user])

  if (isLoading) return <p className="text-muted">{t('profileSettings.loading')}</p>
  if (!profile || !token) return null

  return (
    <div className="flex flex-col gap-4 max-w-xl">
      <SettingsSectionHeader title={t('profileSettings.title')} />
      <EditProfileForm
        profile={profile}
        token={token}
        onSave={(updated) => {
          setProfile(updated)
          setProfileSnapshot(updated)
          navigate(`/profile/${updated.username}`)
        }}
        onCancel={() => navigate('/settings')}
      />
    </div>
  )
}
