import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Gamepad2 } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Avatar } from '../components/ui/Avatar'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { InviteModal } from '../components/ui/InviteModal'
import { useAuth } from '../context/AuthContext'
import { getLookingForGamePlayers, type LookingForGamePlayer } from '../api/profilesApi'
import { cancelInvitation } from '../api/invitationsApi'
import { ApiError } from '../api/http'

export default function FindPlayersPage() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [players, setPlayers] = useState<LookingForGamePlayer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [invitePlayer, setInvitePlayer] = useState<LookingForGamePlayer | null>(null)
  const [cancellingUserId, setCancellingUserId] = useState<string | null>(null)
  const [cancelError, setCancelError] = useState<string | null>(null)

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
    const player = players.find((p) => p.userId === userId)
    setPlayers((prev) =>
      prev.map((p) => (p.userId === userId ? { ...p, relationshipStatus: 'InvitePending' } : p)),
    )
    setSuccessMessage(`Invitation sent${player ? ` to ${player.displayName}` : ''}.`)
  }

  async function handleCancelInvite(player: LookingForGamePlayer) {
    if (!token || !player.pendingInvitationId) return
    setCancellingUserId(player.userId)
    setCancelError(null)
    try {
      await cancelInvitation(token, player.pendingInvitationId)
      setPlayers((prev) =>
        prev.map((p) =>
          p.userId === player.userId ? { ...p, relationshipStatus: 'None', pendingInvitationId: null } : p,
        ),
      )
      setSuccessMessage(`Invitation to ${player.displayName} cancelled.`)
    } catch (err) {
      setSuccessMessage(null)
      setCancelError(err instanceof ApiError ? err.message : 'Failed to cancel invitation.')
    } finally {
      setCancellingUserId(null)
    }
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
      <div className="mb-2 border-l-4 border-primary pl-4">
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary">Discover your squad</p>
        <h1 className="text-3xl font-bold tracking-tight text-text">Find Your Party</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          Meet new friends, chase new adventures, and find players ready to squad up.
        </p>
      </div>

      {successMessage && (
        <div className="rounded-xl border border-enjoying/40 bg-enjoying/10 px-4 py-3 text-sm text-enjoying">
          {successMessage}
        </div>
      )}

      {cancelError && (
        <div className="rounded-xl border border-frustrated/40 bg-frustrated/10 px-4 py-3 text-sm text-frustrated">
          {cancelError}
        </div>
      )}

      {players.length === 0 ? (
        <Card>
          <p className="text-muted">No one is looking for a game right now.</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {players.map((player) => (
            <Card key={player.userId} className="flex items-center justify-between gap-4">
              <div
                className="group flex min-w-0 cursor-pointer items-center gap-3"
                onClick={() => navigate(`/profile/${player.username}`)}
              >
                <Avatar src={player.avatarUrl ?? undefined} alt={player.displayName} status="looking-for-game" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-text group-hover:underline">{player.displayName}</p>
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

              <div className="flex shrink-0 items-center gap-2">
                {player.relationshipStatus === 'Friends' && (
                  <>
                    <Badge variant="completed">Friend</Badge>
                    <Button
                      size="sm"
                      onClick={() => {
                        setSuccessMessage(null)
                        setInvitePlayer(player)
                      }}
                    >
                      Invite
                    </Button>
                  </>
                )}
                {player.relationshipStatus === 'InvitePending' && (
                  <>
                    <Badge variant="tag">Invited</Badge>
                    {player.pendingInvitationId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancelInvite(player)}
                        disabled={cancellingUserId === player.userId}
                      >
                        {cancellingUserId === player.userId ? 'Cancelling...' : 'Cancel'}
                      </Button>
                    )}
                  </>
                )}
                {player.relationshipStatus === 'None' && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setSuccessMessage(null)
                      setInvitePlayer(player)
                    }}
                  >
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
