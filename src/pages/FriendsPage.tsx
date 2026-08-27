import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { Avatar, type AvatarStatus } from '../components/ui/Avatar'
import { Button } from '../components/ui/Button'
import { getFriends, type Friend } from '../api/friendsApi'
import { getProfile, type ProfileStatus } from '../api/profilesApi'
import { useAuth } from '../context/AuthContext'
import { useChat } from '../context/ChatContext'

const statusAvatarMap: Record<ProfileStatus, AvatarStatus> = {
  Online: 'online',
  LookingForGame: 'looking-for-game',
  Busy: 'busy',
  Offline: 'offline',
}

export default function FriendsPage() {
  const { token } = useAuth()
  const { openChatWithUser, error: chatError } = useChat()
  const navigate = useNavigate()
  const [friends, setFriends] = useState<Friend[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusByUsername, setStatusByUsername] = useState<Record<string, ProfileStatus>>({})

  useEffect(() => {
    if (!token) return
    setIsLoading(true)
    setError(null)
    getFriends(token)
      .then(setFriends)
      .catch(() => setError('Failed to load friends.'))
      .finally(() => setIsLoading(false))
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

  return (
    <div className="flex flex-col gap-4">
      <div className="mb-2 border-l-4 border-primary pl-4">
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary">Your crew</p>
        <h1 className="text-3xl font-bold tracking-tight text-text">Friends</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          The players you've connected with. Jump into a chat or check out their profile whenever you're ready to play.
        </p>
      </div>

      {chatError && <p className="text-sm text-frustrated">{chatError}</p>}
      {isLoading && <p className="text-muted">Loading friends...</p>}
      {error && <p className="text-frustrated">{error}</p>}
      {!isLoading && !error && friends.length === 0 && (
        <Card>
          <p className="text-muted">No friends yet. Accept an invite or find players to connect with.</p>
        </Card>
      )}

      {friends.map((friend) => (
        <Card key={friend.userId} className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar
              src={friend.avatarUrl ?? undefined}
              alt={friend.displayName}
              status={statusByUsername[friend.username] ? statusAvatarMap[statusByUsername[friend.username]] : undefined}
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-text">{friend.displayName}</p>
              <p className="truncate text-xs text-muted">@{friend.username}</p>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate(`/profile/${friend.username}`)}>
              View profile
            </Button>
            <Button size="sm" onClick={() => handleOpenChat(friend)}>
              Chat
            </Button>
          </div>
        </Card>
      ))}
    </div>
  )
}
