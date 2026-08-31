import { useState, useEffect, useRef, type MouseEvent as ReactMouseEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Mail, Menu, Bell, Settings, LogOut, UserRound } from 'lucide-react'
import { IconButton } from '../ui/IconButton'
import { Avatar } from '../ui/Avatar'
import { useAuth } from '../../context/AuthContext'
import { useStatus } from '../../context/StatusContext'
import { useNotifications } from '../../context/NotificationContext'
import type { NotificationItem } from '../../api/notificationsApi'
import { searchProfiles, type ProfileSearchResult } from '../../api/profilesApi'
import {
  getRecentSearches,
  addRecentSearch,
  removeRecentSearch,
  clearRecentSearches,
  type RecentSearch,
} from '../../lib/recentSearches'
import {
  getIncomingInvitations,
  getSentInvitations,
  acceptInvitation,
  declineInvitation,
  cancelInvitation,
  type Invitation,
} from '../../api/invitationsApi'
import {
  getIncomingFriendRequests,
  getSentFriendRequests,
  acceptFriendRequest,
  declineFriendRequest,
  cancelFriendRequest,
  type FriendRequest,
} from '../../api/friendRequestsApi'
import { ApiError } from '../../api/http'
import { Search, X } from 'lucide-react'
import { useChat } from '../../context/ChatContext'
import {
  onInvitationReceived,
  onInvitationUpdated,
  onFriendRequestReceived,
  onFriendRequestUpdated,
} from '../../lib/chatHubConnection'

const statusAvatarMap = {
  Online: 'online',
  LookingForGame: 'looking-for-game',
  Busy: 'busy',
  Inactive: 'inactive',
  Offline: 'offline',
} as const

export function TopBar({ onMenuClick }: { onMenuClick?: () => void }) {
  const { t } = useTranslation('layout')
  const { user, token, logout } = useAuth()
  const { status, avatarUrl } = useStatus()
  const { openChatWithUser } = useChat()
  const { notifications, unreadCount, isLoading: notificationsLoading, markRead, markAllRead } = useNotifications()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ProfileSearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [noResults, setNoResults] = useState(false)
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>(() => getRecentSearches())
  const containerRef = useRef<HTMLDivElement>(null)

  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [sentInvitations, setSentInvitations] = useState<Invitation[]>([])
  const [incomingFriendRequests, setIncomingFriendRequests] = useState<FriendRequest[]>([])
  const [sentFriendRequests, setSentFriendRequests] = useState<FriendRequest[]>([])
  const [invitationTab, setInvitationTab] = useState<'incoming' | 'sent'>('incoming')
  const [isInvitationsOpen, setIsInvitationsOpen] = useState(false)
  const [invitationsLoading, setInvitationsLoading] = useState(false)
  const [invitationsError, setInvitationsError] = useState<string | null>(null)
  const [respondingId, setRespondingId] = useState<string | null>(null)
  const invitationsRef = useRef<HTMLDivElement>(null)
  const incomingInvitationCount = invitations.length + incomingFriendRequests.length
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const notificationsRef = useRef<HTMLDivElement>(null)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const profileMenuRef = useRef<HTMLDivElement>(null)

  type PendingItem = {
    id: string
    kind: 'invitation' | 'friendRequest'
    avatarUrl: string | null
    displayName: string
    username: string
    message: string | null
    status: Invitation['status'] | FriendRequest['status']
    createdAt: string
  }

  const incomingItems: PendingItem[] = [
    ...invitations.map((i) => ({
      id: i.id,
      kind: 'invitation' as const,
      avatarUrl: i.senderAvatarUrl,
      displayName: i.senderDisplayName,
      username: i.senderUsername,
      message: i.message,
      status: i.status,
      createdAt: i.createdAt,
    })),
    ...incomingFriendRequests.map((r) => ({
      id: r.id,
      kind: 'friendRequest' as const,
      avatarUrl: r.senderAvatarUrl,
      displayName: r.senderDisplayName,
      username: r.senderUsername,
      message: null,
      status: r.status,
      createdAt: r.createdAt,
    })),
  ].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))

  const sentItems: PendingItem[] = [
    ...sentInvitations.map((i) => ({
      id: i.id,
      kind: 'invitation' as const,
      avatarUrl: i.recipientAvatarUrl,
      displayName: i.recipientDisplayName,
      username: i.recipientUsername,
      message: i.message,
      status: i.status,
      createdAt: i.createdAt,
    })),
    ...sentFriendRequests.map((r) => ({
      id: r.id,
      kind: 'friendRequest' as const,
      avatarUrl: r.recipientAvatarUrl,
      displayName: r.recipientDisplayName,
      username: r.recipientUsername,
      message: null,
      status: r.status,
      createdAt: r.createdAt,
    })),
  ].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))

  // Debounced search
  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < 2) {
      setResults([])
      setNoResults(false)
      return
    }
    const timer = setTimeout(async () => {
      try {
        const data = await searchProfiles(trimmed)
        setResults(data)
        setNoResults(data.length === 0)
        setIsOpen(true)
      } catch {
        setIsOpen(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  const showRecent = isOpen && query.trim().length === 0

  // Fetch incoming invitations and friend requests on mount / token change so the
  // badge count is correct without requiring the user to open the invitations dropdown.
  useEffect(() => {
    if (!token) {
      setInvitations([])
      setIncomingFriendRequests([])
      return
    }
    let cancelled = false
    Promise.all([getIncomingInvitations(token), getIncomingFriendRequests(token)])
      .then(([incoming, incomingRequests]) => {
        if (cancelled) return
        setInvitations(incoming)
        setIncomingFriendRequests(incomingRequests)
      })
      .catch(() => {
        // Silently ignore; the dropdown fetch will surface errors if opened.
      })
    return () => {
      cancelled = true
    }
  }, [token])

  // Live-update invitations and friend requests pushed over the chat hub, so the
  // badge/dropdown reflect new/accepted/declined/cancelled items without a page reload.
  useEffect(() => {
    if (!user) return

    const unsubscribeReceived = onInvitationReceived((invitation) => {
      if (invitation.recipientUserId !== user.id) return
      setInvitations((prev) =>
        prev.some((i) => i.id === invitation.id) ? prev : [invitation, ...prev],
      )
    })

    const unsubscribeUpdated = onInvitationUpdated((invitation) => {
      if (invitation.status !== 'Pending') {
        setInvitations((prev) => prev.filter((i) => i.id !== invitation.id))
      }
      setSentInvitations((prev) => prev.map((i) => (i.id === invitation.id ? invitation : i)))
    })

    const unsubscribeFriendRequestReceived = onFriendRequestReceived((friendRequest) => {
      if (friendRequest.recipientUserId !== user.id) return
      setIncomingFriendRequests((prev) =>
        prev.some((r) => r.id === friendRequest.id) ? prev : [friendRequest, ...prev],
      )
    })

    const unsubscribeFriendRequestUpdated = onFriendRequestUpdated((friendRequest) => {
      if (friendRequest.status !== 'Pending') {
        setIncomingFriendRequests((prev) => prev.filter((r) => r.id !== friendRequest.id))
      }
      setSentFriendRequests((prev) =>
        prev.map((r) => (r.id === friendRequest.id ? friendRequest : r)),
      )
    })

    return () => {
      unsubscribeReceived()
      unsubscribeUpdated()
      unsubscribeFriendRequestReceived()
      unsubscribeFriendRequestUpdated()
    }
  }, [user])

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return
    function handleMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [isOpen])

  function handleSelect(profile: ProfileSearchResult) {
    addRecentSearch({
      userId: profile.userId,
      username: profile.username,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
    })
    setRecentSearches(getRecentSearches())
    setIsOpen(false)
    setQuery('')
    navigate(`/profile/${profile.username}`)
  }

  function handleRemoveRecent(e: ReactMouseEvent, userId: string) {
    e.stopPropagation()
    removeRecentSearch(userId)
    setRecentSearches(getRecentSearches())
  }

  function handleClearRecent() {
    clearRecentSearches()
    setRecentSearches([])
  }

  async function toggleInvitations() {
    const next = !isInvitationsOpen
    setIsInvitationsOpen(next)
    if (next && token) {
      setInvitationsLoading(true)
      setInvitationsError(null)
      try {
        const [incoming, sent, incomingRequests, sentRequests] = await Promise.all([
          getIncomingInvitations(token),
          getSentInvitations(token),
          getIncomingFriendRequests(token),
          getSentFriendRequests(token),
        ])
        setInvitations(incoming)
        setSentInvitations(sent)
        setIncomingFriendRequests(incomingRequests)
        setSentFriendRequests(sentRequests)
      } catch {
        setInvitationsError(t('topBar.invitations.loadError'))
      } finally {
        setInvitationsLoading(false)
      }
    }
  }

  // Close invitations dropdown on outside click
  useEffect(() => {
    if (!isInvitationsOpen) return
    function handleMouseDown(e: MouseEvent) {
      if (invitationsRef.current && !invitationsRef.current.contains(e.target as Node)) {
        setIsInvitationsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [isInvitationsOpen])

  // Close notifications dropdown on outside click
  useEffect(() => {
    if (!isNotificationsOpen) return
    function handleMouseDown(e: MouseEvent) {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setIsNotificationsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [isNotificationsOpen])

  // Close profile menu on outside click
  useEffect(() => {
    if (!isProfileMenuOpen) return
    function handleMouseDown(e: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [isProfileMenuOpen])

  function handleViewProfile() {
    setIsProfileMenuOpen(false)
    if (user) navigate(`/profile/${user.username}`)
  }

  function handleSettingsClick() {
    setIsProfileMenuOpen(false)
    navigate('/settings')
  }

  function handleSignOutClick() {
    setIsProfileMenuOpen(false)
    logout()
    navigate('/login', { replace: true })
  }

  async function handleNotificationClick(notification: NotificationItem) {
    setIsNotificationsOpen(false)
    await markRead(notification.id)
    if (notification.type === 'NewFollower') {
      navigate(`/profile/${notification.actor.username}`)
    } else if (notification.postId) {
      navigate(
        notification.commentId
          ? `/posts/${notification.postId}?commentId=${notification.commentId}`
          : `/posts/${notification.postId}`,
      )
    }
  }

  function formatNotificationTime(createdAt: string): string {
    const diffMs = Date.now() - new Date(createdAt).getTime()
    const diffMin = Math.floor(diffMs / 60_000)
    if (diffMin < 60) return t('topBar.notifications.timeMinutes', { count: Math.max(diffMin, 1) })
    const diffH = Math.floor(diffMin / 60)
    if (diffH < 24) return t('topBar.notifications.timeHours', { count: diffH })
    return t('topBar.notifications.timeDays', { count: Math.floor(diffH / 24) })
  }

  async function handleAccept(item: PendingItem) {
    if (!token) return
    setRespondingId(item.id)
    try {
      if (item.kind === 'invitation') {
        const invitation = await acceptInvitation(token, item.id)
        setInvitations((prev) => prev.filter((i) => i.id !== item.id))
        await openChatWithUser(invitation.senderUserId, {
          successMessage: t('topBar.invitations.acceptedChatMessage', { name: invitation.senderDisplayName }),
        })
      } else {
        await acceptFriendRequest(token, item.id)
        setIncomingFriendRequests((prev) => prev.filter((r) => r.id !== item.id))
      }
      setIsInvitationsOpen(false)
    } catch (err) {
      setInvitationsError(err instanceof ApiError ? err.message : t('topBar.invitations.acceptError'))
    } finally {
      setRespondingId(null)
    }
  }

  async function handleDecline(item: PendingItem) {
    if (!token) return
    setRespondingId(item.id)
    try {
      if (item.kind === 'invitation') {
        await declineInvitation(token, item.id)
        setInvitations((prev) => prev.filter((i) => i.id !== item.id))
      } else {
        await declineFriendRequest(token, item.id)
        setIncomingFriendRequests((prev) => prev.filter((r) => r.id !== item.id))
      }
    } catch (err) {
      setInvitationsError(err instanceof ApiError ? err.message : t('topBar.invitations.declineError'))
    } finally {
      setRespondingId(null)
    }
  }

  async function handleCancel(item: PendingItem) {
    if (!token) return
    setRespondingId(item.id)
    try {
      if (item.kind === 'invitation') {
        await cancelInvitation(token, item.id)
        setSentInvitations((prev) => prev.filter((i) => i.id !== item.id))
      } else {
        await cancelFriendRequest(token, item.id)
        setSentFriendRequests((prev) => prev.filter((r) => r.id !== item.id))
      }
    } catch (err) {
      setInvitationsError(err instanceof ApiError ? err.message : t('topBar.invitations.cancelError'))
    } finally {
      setRespondingId(null)
    }
  }

  return (
    <header className="flex items-center gap-2 border-b border-border bg-surface py-3 pt-[max(0.75rem,env(safe-area-inset-top))] pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] sm:gap-4 sm:pl-[max(1.5rem,env(safe-area-inset-left))] sm:pr-[max(1.5rem,env(safe-area-inset-right))]">
      <IconButton aria-label={t('topBar.openMenu')} onClick={onMenuClick} className="md:hidden">
        <Menu className="h-5 w-5" aria-hidden="true" />
      </IconButton>
      <div className="relative w-full min-w-0 flex-1 sm:max-w-md" ref={containerRef}>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-raised px-3 py-2">
          <Search className="h-4 w-4 text-muted" aria-hidden="true" />
          <input
            type="search"
            aria-label={t('topBar.searchAriaLabel')}
            placeholder={t('topBar.searchPlaceholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              if (query.trim().length === 0) {
                setRecentSearches(getRecentSearches())
                setIsOpen(true)
              }
            }}
            className="w-full bg-transparent text-sm text-text outline-none placeholder:text-muted"
          />
        </div>
        {isOpen && (
          <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border border-border bg-surface shadow-lg overflow-hidden">
            {showRecent ? (
              recentSearches.length === 0 ? (
                <p className="px-4 py-3 text-sm text-muted">{t('topBar.search.noRecentSearches')}</p>
              ) : (
                <>
                  <div className="flex items-center justify-between px-4 pt-3 pb-1">
                    <p className="text-xs font-medium uppercase text-muted">{t('topBar.search.recentSearches')}</p>
                    <button
                      type="button"
                      onClick={handleClearRecent}
                      className="text-xs font-medium text-muted hover:text-text cursor-pointer"
                    >
                      {t('topBar.search.clearAll')}
                    </button>
                  </div>
                  {recentSearches.map((r) => (
                    <div
                      key={r.userId}
                      className="group flex w-full items-center gap-3 px-4 py-2.5 hover:bg-surface-raised transition-colors"
                    >
                      <button
                        onClick={() => handleSelect(r)}
                        className="flex flex-1 items-center gap-3 text-left cursor-pointer"
                      >
                        <Avatar src={r.avatarUrl ?? undefined} alt={r.displayName} size="sm" />
                        <div>
                          <p className="text-sm font-medium text-text">{r.displayName}</p>
                          <p className="text-xs text-muted">@{r.username}</p>
                        </div>
                      </button>
                      <button
                        aria-label={t('topBar.search.removeRecent', { name: r.displayName })}
                        onClick={(e) => handleRemoveRecent(e, r.userId)}
                        className="rounded p-1 text-muted opacity-0 group-hover:opacity-100 hover:bg-border hover:text-text cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </>
              )
            ) : noResults ? (
              <p className="px-4 py-3 text-sm text-muted">{t('topBar.search.noUsersFound')}</p>
            ) : (
              results.map((r) => (
                <button
                  key={r.userId}
                  onClick={() => handleSelect(r)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-surface-raised transition-colors cursor-pointer"
                >
                  <Avatar src={r.avatarUrl ?? undefined} alt={r.displayName} size="sm" />
                  <div>
                    <p className="text-sm font-medium text-text">{r.displayName}</p>
                    <p className="text-xs text-muted">@{r.username}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div className="relative" ref={notificationsRef}>
          <IconButton aria-label={t('topBar.notifications.ariaLabel')} onClick={() => setIsNotificationsOpen((open) => !open)}>
            <Bell className="h-5 w-5" aria-hidden="true" />
          </IconButton>
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-frustrated px-1 text-[10px] font-bold leading-none text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
          {isNotificationsOpen && (
            <div className="absolute right-0 top-full z-50 mt-1 w-[min(20rem,calc(100vw-1.5rem))] rounded-lg border border-border bg-surface shadow-lg overflow-hidden">
              <div className="flex items-center justify-between border-b border-border px-4 py-2">
                <p className="text-sm font-semibold text-text">{t('topBar.notifications.title')}</p>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllRead}
                    className="text-xs font-medium text-muted hover:text-text cursor-pointer"
                  >
                    {t('topBar.notifications.markAllRead')}
                  </button>
                )}
              </div>
              {notificationsLoading && notifications.length === 0 ? (
                <p className="px-4 py-3 text-sm text-muted">{t('topBar.loading')}</p>
              ) : notifications.length === 0 ? (
                <p className="px-4 py-3 text-sm text-muted">{t('topBar.notifications.empty')}</p>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  {notifications.map((notification) => (
                    <button
                      key={notification.id}
                      type="button"
                      onClick={() => handleNotificationClick(notification)}
                      className={`flex w-full items-start gap-3 border-b border-border px-4 py-3 text-left last:border-b-0 hover:bg-surface-raised cursor-pointer ${
                        notification.isRead ? '' : 'bg-surface-raised/60'
                      }`}
                    >
                      <Avatar
                        src={notification.actor.avatarUrl ?? undefined}
                        alt={notification.actor.displayName}
                        size="sm"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-text">
                          <span className="font-medium">{notification.actor.displayName}</span>{' '}
                          {notification.type === 'NewFollower'
                            ? t('topBar.notifications.newFollower')
                            : notification.type === 'CommentMention'
                              ? t('topBar.notifications.taggedInComment')
                              : t('topBar.notifications.taggedInPost')}
                        </p>
                        <p className="mt-0.5 text-xs text-muted">{formatNotificationTime(notification.createdAt)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="relative" ref={invitationsRef}>
          <IconButton aria-label={t('topBar.invitations.ariaLabel')} onClick={toggleInvitations}>
            <Mail className="h-5 w-5" aria-hidden="true" />
          </IconButton>
          {incomingInvitationCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-frustrated px-1 text-[10px] font-bold leading-none text-white">
              {incomingInvitationCount > 9 ? '9+' : incomingInvitationCount}
            </span>
          )}
          {isInvitationsOpen && (
            <div className="absolute right-0 top-full z-50 mt-1 w-[min(20rem,calc(100vw-1.5rem))] rounded-lg border border-border bg-surface shadow-lg overflow-hidden">
              <div className="border-b border-border px-4 py-2">
                <p className="text-sm font-semibold text-text">{t('topBar.invitations.title')}</p>
              </div>
              <div className="flex border-b border-border bg-surface-raised/50 p-1">
                <button
                  type="button"
                  onClick={() => setInvitationTab('incoming')}
                  className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                    invitationTab === 'incoming' ? 'bg-surface text-text' : 'text-muted hover:text-text'
                  }`}
                >
                  {t('topBar.invitations.incoming')}
                </button>
                <button
                  type="button"
                  onClick={() => setInvitationTab('sent')}
                  className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                    invitationTab === 'sent' ? 'bg-surface text-text' : 'text-muted hover:text-text'
                  }`}
                >
                  {t('topBar.invitations.sent')}
                </button>
              </div>
              {invitationsLoading ? (
                <p className="px-4 py-3 text-sm text-muted">{t('topBar.loading')}</p>
              ) : invitationsError ? (
                <p className="px-4 py-3 text-sm text-frustrated">{invitationsError}</p>
              ) : invitationTab === 'incoming' && incomingItems.length === 0 ? (
                <p className="px-4 py-3 text-sm text-muted">{t('topBar.invitations.noIncoming')}</p>
              ) : invitationTab === 'sent' && sentItems.length === 0 ? (
                <p className="px-4 py-3 text-sm text-muted">{t('topBar.invitations.noSent')}</p>
              ) : invitationTab === 'incoming' ? (
                <div className="max-h-96 overflow-y-auto">
                  {incomingItems.map((item) => (
                    <div key={item.id} className="flex gap-3 border-b border-border px-4 py-3 last:border-b-0">
                      <Avatar src={item.avatarUrl ?? undefined} alt={item.displayName} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setIsInvitationsOpen(false)
                              navigate(`/profile/${item.username}`)
                            }}
                            className="truncate text-left text-sm font-medium text-text hover:underline cursor-pointer"
                          >
                            {item.displayName}
                          </button>
                          <span className="shrink-0 rounded-full bg-surface-raised px-2 py-0.5 text-[11px] font-medium text-muted">
                            {item.kind === 'invitation' ? t('topBar.invitations.gameInvite') : t('topBar.invitations.friendRequest')}
                          </span>
                        </div>
                        {item.message && (
                          <p className="mt-0.5 text-xs text-muted break-words">{item.message}</p>
                        )}
                        <div className="mt-2 flex gap-2">
                          <button
                            onClick={() => handleAccept(item)}
                            disabled={respondingId === item.id}
                            className="rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-white hover:bg-primary-hover disabled:opacity-50 cursor-pointer"
                          >
                            {t('topBar.invitations.accept')}
                          </button>
                          <button
                            onClick={() => handleDecline(item)}
                            disabled={respondingId === item.id}
                            className="rounded-md bg-surface-raised px-2.5 py-1 text-xs font-medium text-text hover:bg-border disabled:opacity-50 cursor-pointer"
                          >
                            {t('topBar.invitations.decline')}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  {sentItems.map((item) => (
                    <div key={item.id} className="flex gap-3 border-b border-border px-4 py-3 last:border-b-0">
                      <Avatar src={item.avatarUrl ?? undefined} alt={item.displayName} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-medium text-text">{item.displayName}</p>
                          <span className="shrink-0 rounded-full bg-surface-raised px-2 py-0.5 text-[11px] font-medium text-muted">
                            {item.kind === 'invitation' ? t('topBar.invitations.gameInvite') : t('topBar.invitations.friendRequest')} · {item.status}
                          </span>
                        </div>
                        {item.message && (
                          <p className="mt-0.5 text-xs text-muted break-words">{item.message}</p>
                        )}
                        {item.status === 'Pending' && (
                          <div className="mt-2 flex gap-2">
                            <button
                              onClick={() => handleCancel(item)}
                              disabled={respondingId === item.id}
                              className="rounded-md bg-surface-raised px-2.5 py-1 text-xs font-medium text-text hover:bg-border disabled:opacity-50 cursor-pointer"
                            >
                              {t('topBar.invitations.cancel')}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        {user && (
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setIsProfileMenuOpen((open) => !open)}
              className="rounded-full focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
              aria-label={t('topBar.myProfile')}
            >
              <Avatar src={avatarUrl ?? undefined} alt={user.displayName ?? user.username} status={statusAvatarMap[status]} />
            </button>
            {isProfileMenuOpen && (
              <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-border bg-surface shadow-lg overflow-hidden">
                <button
                  type="button"
                  onClick={handleViewProfile}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-text hover:bg-surface-raised cursor-pointer"
                >
                  <UserRound className="h-4 w-4" aria-hidden="true" />
                  {t('topBar.profileMenu.viewProfile')}
                </button>
                <button
                  type="button"
                  onClick={handleSettingsClick}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-text hover:bg-surface-raised cursor-pointer"
                >
                  <Settings className="h-4 w-4" aria-hidden="true" />
                  {t('topBar.profileMenu.settings')}
                </button>
                <button
                  type="button"
                  onClick={handleSignOutClick}
                  className="flex w-full items-center gap-2 border-t border-border px-4 py-2.5 text-left text-sm text-frustrated hover:bg-surface-raised cursor-pointer"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  {t('topBar.profileMenu.signOut')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
