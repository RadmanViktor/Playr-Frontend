import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { EditProfileForm } from '../components/EditProfileForm'
import { getProfile, type ProfileData } from '../api/profilesApi'
import { useAuth } from '../context/AuthContext'

export default function SettingsPage() {
  const { user, token } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    getProfile(user.username)
      .then(setProfile)
      .finally(() => setIsLoading(false))
  }, [user])

  if (isLoading) return <p className="text-muted">Loading…</p>
  if (!profile || !token) return null

  return (
    <div className="flex flex-col gap-4 max-w-xl">
      <h1 className="text-2xl font-bold text-text">Settings</h1>
      <EditProfileForm
        profile={profile}
        token={token}
        onSave={(updated) => {
          setProfile(updated)
          navigate(`/profile/${updated.username}`)
        }}
        onCancel={() => navigate(-1)}
      />
    </div>
  )
}
