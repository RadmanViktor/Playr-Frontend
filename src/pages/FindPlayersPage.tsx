import { useCallback, useEffect, useState } from 'react'
import { Gamepad2 } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Avatar } from '../components/ui/Avatar'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { InviteModal } from '../components/ui/InviteModal'
import { useAuth } from '../context/AuthContext'
import { getLookingForGamePlayers, type LookingForGamePlayer } from '../api/profilesApi'

export default function FindPlayersPage() {
  const { token } = useAuth()
  const [players, setPlayers] = useState<LookingForGamePlayer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [invitePlayer, setInvitePlayer] = useState<LookingForGamePlayer | null>(null)

  const loadPlayers = useCallback(async () => {
    if (!token) return
    setIsLoading(true)
    setError(null)
    try {
      const result = await getLookingForGamePlayers(token)
      setPlayers(result)
    } catch {
      setError('Failed to load players. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [token])

  useEffect(() => {
    loadPlayers()
  }, [loadPlayers])

  function handleInviteSent(userId: string) {
    setPlayers((prev) =>
      prev.map((p) => (p.userId === userId ? { ...p, relationshipStatus: 'InvitePending' } : p)),
    )
  }

  if (isLoading) {
    return (
      <Card>
        <p className="text-muted">Loading players...</p>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <p className="text-frustrated">{error}</p>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <h1 className="mb-1 text-lg font-semibold text-text">Find Players</h1>
        <p className="text-sm text-muted">Players currently looking for a game.</p>
      </Card>

      {players.length === 0 ? (
        <Card>
          <p className="text-muted">No one is looking for a game right now.</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {players.map((player) => (
            <Card key={player.userId} className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar src={player.avatarUrl ?? undefined} alt={player.displayName} status="looking-for-game" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-text">{player.displayName}</p>
                  <p className="truncate text-xs text-muted">@{player.username}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    {player.lookingForGameName && (
                      <Badge variant="tag">
                        <Gamepad2 className="mr-1 h-3 w-3" aria-hidden="true" />
                        {player.lookingForGameName}
                      </Badge>
                    )}
                    {player.lookingForPlayStyle && (
                      <Badge variant={player.lookingForPlayStyle === 'Competitive' ? 'need-help' : 'enjoying'}>
                        {player.lookingForPlayStyle}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="shrink-0">
                {player.relationshipStatus === 'Friends' && <Badge variant="completed">Friend</Badge>}
                {player.relationshipStatus === 'InvitePending' && <Badge variant="tag">Invited</Badge>}
                {player.relationshipStatus === 'None' && (
                  <Button size="sm" onClick={() => setInvitePlayer(player)}>
                    Invite
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {invitePlayer && (
        <InviteModal
          recipientUserId={invitePlayer.userId}
          recipientDisplayName={invitePlayer.displayName}
          recipientAvatarUrl={invitePlayer.avatarUrl}
          onClose={() => setInvitePlayer(null)}
          onSent={() => handleInviteSent(invitePlayer.userId)}
        />
      )}
    </div>
  )
}
