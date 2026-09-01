import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronUp, Gamepad2, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card } from '../components/ui/Card'
import { Avatar } from '../components/ui/Avatar'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { InviteModal } from '../components/ui/InviteModal'
import { LfgGroupApplyModal } from '../components/ui/LfgGroupApplyModal'
import { LookingForGamePanel } from '../components/LookingForGamePanel'
import { CreateGroupPanel } from '../components/CreateGroupPanel'
import { useAuth } from '../context/AuthContext'
import { getLookingForGamePlayers, type LookingForGamePlayer } from '../api/profilesApi'
import { cancelInvitation } from '../api/invitationsApi'
import {
  getOpenLfgGroups,
  getIncomingLfgApplications,
  getMyLfgGroupInvites,
  acceptLfgApplication,
  declineLfgApplication,
  acceptLfgGroupInvite,
  declineLfgGroupInvite,
  cancelLfgGroup,
  type LfgGroup,
  type LfgGroupApplication,
  type LfgGroupInvite,
} from '../api/lfgGroupsApi'
import { ApiError } from '../api/http'
import {
  onLfgGroupUpdated,
  onLfgApplicationReceived,
  onLfgGroupInviteReceived,
  onLfgGroupFilled,
} from '../lib/chatHubConnection'

type FindPlayersMode = 'available' | 'createGroup'

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

  const [mode, setMode] = useState<FindPlayersMode>('available')

  const [groups, setGroups] = useState<LfgGroup[]>([])
  const [groupsLoading, setGroupsLoading] = useState(true)
  const [groupsError, setGroupsError] = useState<string | null>(null)
  const [incomingApplications, setIncomingApplications] = useState<LfgGroupApplication[]>([])
  const [myPendingInvites, setMyPendingInvites] = useState<LfgGroupInvite[]>([])
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null)
  const [applyGroup, setApplyGroup] = useState<LfgGroup | null>(null)
  const [groupActionError, setGroupActionError] = useState<string | null>(null)
  const [busyGroupId, setBusyGroupId] = useState<string | null>(null)
  const [busyApplicationId, setBusyApplicationId] = useState<string | null>(null)

  const myOpenGroup = groups.find((group) => group.myMembershipStatus === 'IsCreator' && group.status === 'Open') ?? null

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

  const loadGroups = useCallback(async () => {
    if (!token) return
    setGroupsLoading(true)
    setGroupsError(null)
    try {
      const [openGroups, applications, invites] = await Promise.all([
        getOpenLfgGroups(token),
        getIncomingLfgApplications(token),
        getMyLfgGroupInvites(token),
      ])
      setGroups(openGroups)
      setIncomingApplications(applications.filter((a) => a.status === 'Pending'))
      setMyPendingInvites(invites.filter((i) => i.status === 'Pending'))
    } catch {
      setGroupsError(t('findPlayers.groupsLoadError'))
    } finally {
      setGroupsLoading(false)
    }
  }, [token])

  useEffect(() => {
    loadPlayers()
  }, [loadPlayers])

  useEffect(() => {
    loadGroups()
  }, [loadGroups])

  useEffect(() => {
    const unsubUpdated = onLfgGroupUpdated(() => loadGroups())
    const unsubApplicationReceived = onLfgApplicationReceived(() => loadGroups())
    const unsubInviteReceived = onLfgGroupInviteReceived(() => loadGroups())
    const unsubFilled = onLfgGroupFilled((group) => {
      setSuccessMessage(t('findPlayers.groupFilledNotice', { gameName: group.gameName }))
      loadGroups()
    })
    return () => {
      unsubUpdated()
      unsubApplicationReceived()
      unsubInviteReceived()
      unsubFilled()
    }
  }, [loadGroups, t])

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

  async function handleCancelGroup(group: LfgGroup) {
    if (!token) return
    setBusyGroupId(group.id)
    setGroupActionError(null)
    try {
      await cancelLfgGroup(token, group.id)
      setSuccessMessage(t('findPlayers.groupCancelled', { gameName: group.gameName }))
      await loadGroups()
    } catch (err) {
      setGroupActionError(err instanceof ApiError ? err.message : t('findPlayers.groupActionError'))
    } finally {
      setBusyGroupId(null)
    }
  }

  async function handleAcceptInvite(invite: LfgGroupInvite) {
    if (!token) return
    setBusyGroupId(invite.lfgGroupId)
    setGroupActionError(null)
    try {
      await acceptLfgGroupInvite(token, invite.id)
      await loadGroups()
    } catch (err) {
      setGroupActionError(err instanceof ApiError ? err.message : t('findPlayers.groupActionError'))
    } finally {
      setBusyGroupId(null)
    }
  }

  async function handleDeclineInvite(invite: LfgGroupInvite) {
    if (!token) return
    setBusyGroupId(invite.lfgGroupId)
    setGroupActionError(null)
    try {
      await declineLfgGroupInvite(token, invite.id)
      await loadGroups()
    } catch (err) {
      setGroupActionError(err instanceof ApiError ? err.message : t('findPlayers.groupActionError'))
    } finally {
      setBusyGroupId(null)
    }
  }

  async function handleAcceptApplication(application: LfgGroupApplication) {
    if (!token) return
    setBusyApplicationId(application.id)
    setGroupActionError(null)
    try {
      await acceptLfgApplication(token, application.id)
      await loadGroups()
    } catch (err) {
      setGroupActionError(err instanceof ApiError ? err.message : t('findPlayers.groupActionError'))
    } finally {
      setBusyApplicationId(null)
    }
  }

  async function handleDeclineApplication(application: LfgGroupApplication) {
    if (!token) return
    setBusyApplicationId(application.id)
    setGroupActionError(null)
    try {
      await declineLfgApplication(token, application.id)
      await loadGroups()
    } catch (err) {
      setGroupActionError(err instanceof ApiError ? err.message : t('findPlayers.groupActionError'))
    } finally {
      setBusyApplicationId(null)
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
      {myOpenGroup ? (
        <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-text">
              {t('findPlayers.ownGroupActiveTitle', { gameName: myOpenGroup.gameName })}
            </p>
            <p className="text-xs text-muted">
              {t('findPlayers.ownGroupActiveSubtitle', {
                accepted: myOpenGroup.acceptedCount,
                wanted: myOpenGroup.playersWanted,
              })}
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleCancelGroup(myOpenGroup)}
            disabled={busyGroupId === myOpenGroup.id}
          >
            {busyGroupId === myOpenGroup.id ? t('findPlayers.cancelling') : t('findPlayers.cancelGroup')}
          </Button>
        </Card>
      ) : (
        <>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode('available')}
              className={`flex-1 rounded-lg border p-2 text-center text-sm font-medium transition-colors cursor-pointer ${
                mode === 'available'
                  ? 'border-primary bg-surface-raised text-text'
                  : 'border-border text-muted hover:bg-surface-raised'
              }`}
            >
              {t('findPlayers.modeAvailable')}
            </button>
            <button
              type="button"
              onClick={() => setMode('createGroup')}
              className={`flex-1 rounded-lg border p-2 text-center text-sm font-medium transition-colors cursor-pointer ${
                mode === 'createGroup'
                  ? 'border-primary bg-surface-raised text-text'
                  : 'border-border text-muted hover:bg-surface-raised'
              }`}
            >
              {t('findPlayers.modeCreateGroup')}
            </button>
          </div>

          {mode === 'available' ? (
            <LookingForGamePanel onChanged={loadPlayers} />
          ) : (
            <CreateGroupPanel onChanged={loadGroups} />
          )}
        </>
      )}

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

      {groupActionError && (
        <div className="rounded-xl border border-frustrated/40 bg-frustrated/10 px-4 py-3 text-sm text-frustrated">
          {groupActionError}
        </div>
      )}

      {!groupsLoading && !groupsError && groups.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-text">{t('findPlayers.groupsTitle')}</h2>
          {groups.map((group) => {
            const groupApplications = incomingApplications.filter((a) => a.lfgGroupId === group.id)
            const isExpanded = expandedGroupId === group.id
            const isBusy = busyGroupId === group.id
            return (
              <Card key={group.id} className="flex flex-col gap-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4">
                  <div
                    className="group flex min-w-0 cursor-pointer items-center gap-3"
                    onClick={() => navigate(`/profile/${group.creatorUsername}`)}
                  >
                    <Avatar src={group.creatorAvatarUrl ?? undefined} alt={group.creatorDisplayName} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-text group-hover:underline">{group.creatorDisplayName}</p>
                      <p className="truncate text-xs text-muted">@{group.creatorUsername}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <Badge variant="tag">
                          <Gamepad2 className="mr-1 h-3 w-3" aria-hidden="true" />
                          {group.gameName}
                        </Badge>
                        {group.playStyle && (
                          <Badge variant={group.playStyle === 'Competitive' ? 'need-help' : 'enjoying'}>
                            {group.playStyle}
                          </Badge>
                        )}
                        <Badge variant="completed">
                          <Users className="mr-1 h-3 w-3" aria-hidden="true" />
                          {t('findPlayers.groupCounter', { accepted: group.acceptedCount, wanted: group.playersWanted })}
                        </Badge>
                      </div>
                      {group.note && <p className="mt-1 line-clamp-2 text-xs text-muted">{group.note}</p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:shrink-0">
                    {group.myMembershipStatus === 'IsCreator' && (
                      <>
                        {groupApplications.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedGroupId(isExpanded ? null : group.id)}
                          >
                            {t('findPlayers.reviewApplications', { count: groupApplications.length })}
                            {isExpanded ? (
                              <ChevronUp className="ml-1 h-4 w-4" aria-hidden="true" />
                            ) : (
                              <ChevronDown className="ml-1 h-4 w-4" aria-hidden="true" />
                            )}
                          </Button>
                        )}
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleCancelGroup(group)}
                          disabled={isBusy}
                        >
                          {isBusy ? t('findPlayers.cancelling') : t('findPlayers.cancelGroup')}
                        </Button>
                      </>
                    )}
                    {group.myMembershipStatus !== 'IsCreator' && group.myApplicationStatus === 'Pending' && (
                      <Badge variant="tag">{t('findPlayers.applicationSent')}</Badge>
                    )}
                    {group.myMembershipStatus !== 'IsCreator' &&
                      group.myApplicationStatus !== 'Pending' &&
                      group.myInviteStatus === 'Pending' &&
                      (() => {
                        const invite = myPendingInvites.find((i) => i.lfgGroupId === group.id)
                        if (!invite) return null
                        return (
                          <>
                            <Button size="sm" onClick={() => handleAcceptInvite(invite)} disabled={isBusy}>
                              {t('findPlayers.accept')}
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeclineInvite(invite)} disabled={isBusy}>
                              {t('findPlayers.decline')}
                            </Button>
                          </>
                        )
                      })()}
                    {group.myMembershipStatus !== 'IsCreator' &&
                      group.myApplicationStatus !== 'Pending' &&
                      group.myInviteStatus !== 'Pending' &&
                      group.myMembershipStatus !== 'IsMember' && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSuccessMessage(null)
                            setApplyGroup(group)
                          }}
                        >
                          {t('findPlayers.applyToGroup')}
                        </Button>
                      )}
                  </div>
                </div>

                {isExpanded && groupApplications.length > 0 && (
                  <div className="flex flex-col gap-2 border-t border-border pt-3">
                    {groupApplications.map((application) => (
                      <div
                        key={application.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-surface-raised px-3 py-2"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <Avatar
                            src={application.applicantAvatarUrl ?? undefined}
                            alt={application.applicantDisplayName}
                            size="sm"
                          />
                          <div className="min-w-0">
                            <p className="truncate text-sm text-text">{application.applicantDisplayName}</p>
                            {application.message && (
                              <p className="truncate text-xs text-muted">{application.message}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleAcceptApplication(application)}
                            disabled={busyApplicationId === application.id}
                          >
                            {t('findPlayers.accept')}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeclineApplication(application)}
                            disabled={busyApplicationId === application.id}
                          >
                            {t('findPlayers.decline')}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {groupsError && <p className="text-sm text-frustrated">{groupsError}</p>}

      {players.length === 0 ? (
        <Card>
          <p className="text-muted">{t('findPlayers.emptyState')}</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-text">{t('findPlayers.playersTitle')}</h2>
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

      {applyGroup && (
        <LfgGroupApplyModal
          lfgGroupId={applyGroup.id}
          creatorDisplayName={applyGroup.creatorDisplayName}
          creatorAvatarUrl={applyGroup.creatorAvatarUrl}
          gameName={applyGroup.gameName}
          onClose={() => setApplyGroup(null)}
          onSent={() => {
            setSuccessMessage(t('findPlayers.applicationSentNotice'))
            loadGroups()
          }}
        />
      )}
    </div>
  )
}
