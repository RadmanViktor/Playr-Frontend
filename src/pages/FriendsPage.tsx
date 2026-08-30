import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card } from '../components/ui/Card'
import { Avatar, type AvatarStatus } from '../components/ui/Avatar'
import { Button } from '../components/ui/Button'
import { getFriends, type Friend } from '../api/friendsApi'
import {
  getIncomingFriendRequests,
  acceptFriendRequest,
  declineFriendRequest,
  type FriendRequest,
} from '../api/friendRequestsApi'
import { getProfile, type ProfileStatus } from '../api/profilesApi'
import { useAuth } from '../context/AuthContext'
import { useChat } from '../context/ChatContext'
import { ApiError } from '../api/http'

const statusAvatarMap: Record<ProfileStatus, AvatarStatus> = {
  Online: 'online',
  LookingForGame: 'looking-for-game',
  Busy: 'busy',
  Inactive: 'inactive',
  Offline: 'offline',
}

export default function FriendsPage() {
  const { t } = useTranslation('pagesA')
  const { token } = useAuth()
  const { openChatWithUser, error: chatError } = useChat()
  const navigate = useNavigate()
  const [friends, setFriends] = useState<Friend[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusByUsername, setStatusByUsername] = useState<Record<string, ProfileStatus>>({})
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([])
  const [isLoadingRequests, setIsLoadingRequests] = useState(true)
  const [requestActionError, setRequestActionError] = useState<string | null>(null)
  const [respondingRequestId, setRespondingRequestId] = useState<string | null>(null)

  function reloadFriends() {
    if (!token) return
    setIsLoading(true)
    setError(null)
    getFriends(token)
      .then(setFriends)
      .catch(() => setError(t('friends.loadError')))
      .finally(() => setIsLoading(false))
  }

  function reloadIncomingRequests() {
    if (!token) return
    setIsLoadingRequests(true)
    getIncomingFriendRequests(token)
      .then(setIncomingRequests)
      .catch(() => {
        /* non-critical */
      })
      .finally(() => setIsLoadingRequests(false))
  }

  useEffect(() => {
    reloadFriends()
    reloadIncomingRequests()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  useEffect(() => {
    if (friends.length === 0) return
    let cancelled = false
    Promise.all(
      friends.map((friend) =>
        getProfile(friend.username)
          .then((profile) => [friend.username, profile.status] as const)
          .catch(() => null),
      ),
    ).then((results) => {
      if (cancelled) return
      setStatusByUsername((prev) => {
        const next = { ...prev }
        for (const result of results) {
          if (result) next[result[0]] = result[1]
        }
        return next
      })
    })
    return () => {
      cancelled = true
    }
  }, [friends])

  async function handleOpenChat(friend: Friend) {
    await openChatWithUser(friend.userId)
  }

  async function handleAcceptRequest(request: FriendRequest) {
    if (!token) return
    setRespondingRequestId(request.id)
    setRequestActionError(null)
    try {
      await acceptFriendRequest(token, request.id)
      setIncomingRequests((prev) => prev.filter((r) => r.id !== request.id))
      reloadFriends()
    } catch (err) {
      setRequestActionError(err instanceof ApiError ? err.message : t('friends.acceptError'))
    } finally {
      setRespondingRequestId(null)
    }
  }

  async function handleDeclineRequest(request: FriendRequest) {
    if (!token) return
    setRespondingRequestId(request.id)
    setRequestActionError(null)
    try {
      await declineFriendRequest(token, request.id)
      setIncomingRequests((prev) => prev.filter((r) => r.id !== request.id))
    } catch (err) {
      setRequestActionError(err instanceof ApiError ? err.message : t('friends.declineError'))
    } finally {
      setRespondingRequestId(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="mb-2 border-l-4 border-primary pl-4">
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary">{t('friends.eyebrow')}</p>
        <h1 className="text-3xl font-bold tracking-tight text-text">{t('friends.title')}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          {t('friends.subtitle')}
        </p>
      </div>

      {!isLoadingRequests && incomingRequests.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">{t('friends.friendRequests')}</h2>
          {requestActionError && <p className="text-sm text-frustrated">{requestActionError}</p>}
          {incomingRequests.map((request) => (
            <Card key={request.id} className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar src={request.senderAvatarUrl ?? undefined} alt={request.senderDisplayName} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-text">{request.senderDisplayName}</p>
                  <p className="truncate text-xs text-muted">@{request.senderUsername}</p>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeclineRequest(request)}
                  disabled={respondingRequestId === request.id}
                >
                  {t('friends.decline')}
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleAcceptRequest(request)}
                  disabled={respondingRequestId === request.id}
                >
                  {respondingRequestId === request.id ? t('friends.working') : t('friends.accept')}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {chatError && <p className="text-sm text-frustrated">{chatError}</p>}
      {isLoading && <p className="text-muted">{t('friends.loading')}</p>}
      {error && <p className="text-frustrated">{error}</p>}
      {!isLoading && !error && friends.length === 0 && (
        <Card>
          <p className="text-muted">{t('friends.emptyState')}</p>
        </Card>
      )}

      {friends.map((friend) => (
        <Card key={friend.userId} className="flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigate(`/profile/${friend.username}`)}
            className="group flex min-w-0 items-center gap-3 rounded-md p-1 -m-1 text-left transition-colors hover:bg-surface-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
          >
            <Avatar
              src={friend.avatarUrl ?? undefined}
              alt={friend.displayName}
              status={statusByUsername[friend.username] ? statusAvatarMap[statusByUsername[friend.username]] : undefined}
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-text group-hover:text-primary group-hover:underline">
                {friend.displayName}
              </p>
              <p className="truncate text-xs text-muted">@{friend.username}</p>
            </div>
          </button>
          <div className="flex shrink-0 gap-2">
            <Button size="sm" onClick={() => handleOpenChat(friend)}>
              {t('friends.chat')}
            </Button>
          </div>
        </Card>
      ))}
    </div>
  )
}
