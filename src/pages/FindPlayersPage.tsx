import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Gamepad2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card } from '../components/ui/Card'
import { Avatar } from '../components/ui/Avatar'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { InviteModal } from '../components/ui/InviteModal'
import { LookingForGamePanel } from '../components/LookingForGamePanel'
import { useAuth } from '../context/AuthContext'
import { getLookingForGamePlayers, type LookingForGamePlayer } from '../api/profilesApi'
import { cancelInvitation } from '../api/invitationsApi'
import { ApiError } from '../api/http'

export default function FindPlayersPage() {
  const { t } = useTranslation('pagesA')
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
      setError(t('findPlayers.loadError'))
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
    setSuccessMessage(player ? t('findPlayers.invitationSentTo', { name: player.displayName }) : t('findPlayers.invitationSent'))
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
      setSuccessMessage(t('findPlayers.invitationCancelled', { name: player.displayName }))
    } catch (err) {
      setSuccessMessage(null)
      setCancelError(err instanceof ApiError ? err.message : t('findPlayers.cancelInviteError'))
    } finally {
      setCancellingUserId(null)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <p className="text-muted">{t('findPlayers.loading')}</p>
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
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary">{t('findPlayers.eyebrow')}</p>
        <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">{t('findPlayers.title')}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          {t('findPlayers.subtitle')}
        </p>
      </div>

      <LookingForGamePanel onChanged={loadPlayers} />

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
          <p className="text-muted">{t('findPlayers.emptyState')}</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {players.map((player) => (
            <Card key={player.userId} className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4">
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
                  {player.lookingForGameNote && (
                    <p className="mt-1 line-clamp-2 text-xs text-muted">{player.lookingForGameNote}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 sm:shrink-0">
                {player.relationshipStatus === 'Friends' && (
                  <>
                    <Badge variant="completed">{t('findPlayers.friendBadge')}</Badge>
                    <Button
                      size="sm"
                      className="flex-1 sm:flex-none"
                      onClick={() => {
                        setSuccessMessage(null)
                        setInvitePlayer(player)
                      }}
                    >
                      {t('findPlayers.invite')}
                    </Button>
                  </>
                )}
                {player.relationshipStatus === 'InvitePending' && (
                  <>
                    <Badge variant="tag">{t('findPlayers.invitedBadge')}</Badge>
                    {player.pendingInvitationId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 sm:flex-none"
                        onClick={() => handleCancelInvite(player)}
                        disabled={cancellingUserId === player.userId}
                      >
                        {cancellingUserId === player.userId ? t('findPlayers.cancelling') : t('findPlayers.cancel')}
                      </Button>
                    )}
                  </>
                )}
                {player.relationshipStatus === 'None' && (
                  <Button
                    size="sm"
                    className="flex-1 sm:flex-none"
                    onClick={() => {
                      setSuccessMessage(null)
                      setInvitePlayer(player)
                    }}
                  >
                    {t('findPlayers.invite')}
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
