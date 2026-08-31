import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Modal } from './Modal'
import { Avatar } from './Avatar'
import { getFollowers, getFollowing, type Follow } from '../../api/followApi'
import { useAuth } from '../../context/AuthContext'

interface FollowListModalProps {
  userId: string
  mode: 'followers' | 'following'
  onClose: () => void
}

export function FollowListModal({ userId, mode, onClose }: FollowListModalProps) {
  const { t } = useTranslation('ui')
  const { token } = useAuth()
  const navigate = useNavigate()
  const [users, setUsers] = useState<Follow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    let cancelled = false
    setIsLoading(true)
    setError(null)
    const fetchList = mode === 'followers' ? getFollowers : getFollowing
    fetchList(token, userId)
      .then((result) => {
        if (!cancelled) setUsers(result)
      })
      .catch(() => {
        if (!cancelled) setError(t('followListModal.loadError'))
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [token, userId, mode, t])

  function handleSelect(username: string) {
    onClose()
    navigate(`/profile/${username}`)
  }

  const title = mode === 'followers' ? t('followListModal.followersTitle') : t('followListModal.followingTitle')

  return (
    <Modal title={title} onClose={onClose}>
      {isLoading ? (
        <p className="px-1 py-3 text-sm text-muted">{t('followListModal.loading')}</p>
      ) : error ? (
        <p className="px-1 py-3 text-sm text-frustrated">{error}</p>
      ) : users.length === 0 ? (
        <p className="px-1 py-3 text-sm text-muted">{t('followListModal.empty')}</p>
      ) : (
        <div className="-mx-1 flex flex-col">
          {users.map((user) => (
            <button
              key={user.userId}
              type="button"
              onClick={() => handleSelect(user.username)}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-surface-raised cursor-pointer"
            >
              <Avatar src={user.avatarUrl ?? undefined} alt={user.displayName} size="sm" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-text">{user.displayName}</p>
                <p className="truncate text-xs text-muted">@{user.username}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </Modal>
  )
}
