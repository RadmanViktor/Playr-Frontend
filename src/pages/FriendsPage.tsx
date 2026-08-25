import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { Avatar } from '../components/ui/Avatar'
import { Button } from '../components/ui/Button'
import { getFriends, type Friend } from '../api/friendsApi'
import { useAuth } from '../context/AuthContext'
import { useChat } from '../context/ChatContext'

export default function FriendsPage() {
  const { token } = useAuth()
  const { openChatWithUser, error: chatError } = useChat()
  const navigate = useNavigate()
  const [friends, setFriends] = useState<Friend[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    setIsLoading(true)
    setError(null)
    getFriends(token)
      .then(setFriends)
      .catch(() => setError('Failed to load friends.'))
      .finally(() => setIsLoading(false))
  }, [token])

  async function handleOpenChat(friend: Friend) {
    await openChatWithUser(friend.userId)
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <h1 className="mb-1 text-lg font-semibold text-text">Friends</h1>
        <p className="text-sm text-muted">Players you are connected with.</p>
      </Card>

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
            <Avatar src={friend.avatarUrl ?? undefined} alt={friend.displayName} />
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
