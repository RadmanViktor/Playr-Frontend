import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Mail } from 'lucide-react'
import { IconButton } from '../ui/IconButton'
import { Avatar } from '../ui/Avatar'
import { useAuth } from '../../context/AuthContext'
import { useStatus } from '../../context/StatusContext'
import { searchProfiles, type ProfileSearchResult } from '../../api/profilesApi'
import {
  getIncomingInvitations,
  getSentInvitations,
  acceptInvitation,
  declineInvitation,
  type Invitation,
} from '../../api/invitationsApi'
import { ApiError } from '../../api/http'
import { Search } from 'lucide-react'
import { useChat } from '../../context/ChatContext'

const statusAvatarMap = {
  Online: 'online',
  LookingForGame: 'looking-for-game',
  Busy: 'busy',
  Offline: 'offline',
} as const

export function TopBar() {
  const { user, token } = useAuth()
  const { status, avatarUrl } = useStatus()
  const { openChatWithUser } = useChat()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ProfileSearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [noResults, setNoResults] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [sentInvitations, setSentInvitations] = useState<Invitation[]>([])
  const [invitationTab, setInvitationTab] = useState<'incoming' | 'sent'>('incoming')
  const [isInvitationsOpen, setIsInvitationsOpen] = useState(false)
  const [invitationsLoading, setInvitationsLoading] = useState(false)
  const [invitationsError, setInvitationsError] = useState<string | null>(null)
  const [respondingId, setRespondingId] = useState<string | null>(null)
  const invitationsRef = useRef<HTMLDivElement>(null)
  const incomingInvitationCount = invitations.length

  // Debounced search
  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < 2) {
      setIsOpen(false)
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

  function handleSelect(username: string) {
    setIsOpen(false)
    setQuery('')
    navigate(`/profile/${username}`)
  }

  async function toggleInvitations() {
    const next = !isInvitationsOpen
    setIsInvitationsOpen(next)
    if (next && token) {
      setInvitationsLoading(true)
      setInvitationsError(null)
      try {
        const [incoming, sent] = await Promise.all([
          getIncomingInvitations(token),
          getSentInvitations(token),
        ])
        setInvitations(incoming)
        setSentInvitations(sent)
      } catch {
        setInvitationsError('Failed to load invitations.')
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

  async function handleAccept(invitationId: string) {
    if (!token) return
    setRespondingId(invitationId)
    try {
      const invitation = await acceptInvitation(token, invitationId)
      setInvitations((prev) => prev.filter((i) => i.id !== invitationId))
      await openChatWithUser(invitation.senderUserId, {
        successMessage: `You are now connected with ${invitation.senderDisplayName}. Happy gaming! :D`,
      })
      setIsInvitationsOpen(false)
    } catch (err) {
      setInvitationsError(err instanceof ApiError ? err.message : 'Failed to accept invitation.')
    } finally {
      setRespondingId(null)
    }
  }

  async function handleDecline(invitationId: string) {
    if (!token) return
    setRespondingId(invitationId)
    try {
      await declineInvitation(token, invitationId)
      setInvitations((prev) => prev.filter((i) => i.id !== invitationId))
    } catch (err) {
      setInvitationsError(err instanceof ApiError ? err.message : 'Failed to decline invitation.')
    } finally {
      setRespondingId(null)
    }
  }

  return (
    <header className="flex items-center gap-4 border-b border-border bg-surface px-6 py-3">
      <div className="relative w-full max-w-md" ref={containerRef}>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-raised px-3 py-2">
          <Search className="h-4 w-4 text-muted" aria-hidden="true" />
          <input
            type="search"
            aria-label="Search PLAYR"
            placeholder="Search PLAYR"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-text outline-none placeholder:text-muted"
          />
        </div>
        {isOpen && (
          <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border border-border bg-surface shadow-lg overflow-hidden">
            {noResults ? (
              <p className="px-4 py-3 text-sm text-muted">Ingen användare hittades</p>
            ) : (
              results.map((r) => (
                <button
                  key={r.userId}
                  onClick={() => handleSelect(r.username)}
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
        <IconButton aria-label="Notifications">
          <Bell className="h-5 w-5" aria-hidden="true" />
        </IconButton>
        <div className="relative" ref={invitationsRef}>
          <IconButton aria-label="Messages" onClick={toggleInvitations}>
            <Mail className="h-5 w-5" aria-hidden="true" />
          </IconButton>
          {incomingInvitationCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-frustrated px-1 text-[10px] font-bold leading-none text-white">
              {incomingInvitationCount > 9 ? '9+' : incomingInvitationCount}
            </span>
          )}
          {isInvitationsOpen && (
            <div className="absolute right-0 top-full z-50 mt-1 w-80 rounded-lg border border-border bg-surface shadow-lg overflow-hidden">
              <div className="border-b border-border px-4 py-2">
                <p className="text-sm font-semibold text-text">Invitations</p>
              </div>
              <div className="flex border-b border-border bg-surface-raised/50 p-1">
                <button
                  type="button"
                  onClick={() => setInvitationTab('incoming')}
                  className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                    invitationTab === 'incoming' ? 'bg-surface text-text' : 'text-muted hover:text-text'
                  }`}
                >
                  Incoming
                </button>
                <button
                  type="button"
                  onClick={() => setInvitationTab('sent')}
                  className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                    invitationTab === 'sent' ? 'bg-surface text-text' : 'text-muted hover:text-text'
                  }`}
                >
                  Sent
                </button>
              </div>
              {invitationsLoading ? (
                <p className="px-4 py-3 text-sm text-muted">Loading...</p>
              ) : invitationsError ? (
                <p className="px-4 py-3 text-sm text-frustrated">{invitationsError}</p>
              ) : invitationTab === 'incoming' && invitations.length === 0 ? (
                <p className="px-4 py-3 text-sm text-muted">No incoming invitations</p>
              ) : invitationTab === 'sent' && sentInvitations.length === 0 ? (
                <p className="px-4 py-3 text-sm text-muted">No sent invitations</p>
              ) : invitationTab === 'incoming' ? (
                <div className="max-h-96 overflow-y-auto">
                  {invitations.map((invitation) => (
                    <div key={invitation.id} className="flex gap-3 border-b border-border px-4 py-3 last:border-b-0">
                      <Avatar
                        src={invitation.senderAvatarUrl ?? undefined}
                        alt={invitation.senderDisplayName}
                        size="sm"
                      />
                      <div className="min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => {
                            setIsInvitationsOpen(false)
                            navigate(`/profile/${invitation.senderUsername}`)
                          }}
                          className="truncate text-left text-sm font-medium text-text hover:underline cursor-pointer"
                        >
                          {invitation.senderDisplayName}
                        </button>
                        <p className="mt-0.5 text-xs text-muted break-words">{invitation.message}</p>
                        <div className="mt-2 flex gap-2">
                          <button
                            onClick={() => handleAccept(invitation.id)}
                            disabled={respondingId === invitation.id}
                            className="rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-white hover:bg-primary-hover disabled:opacity-50 cursor-pointer"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleDecline(invitation.id)}
                            disabled={respondingId === invitation.id}
                            className="rounded-md bg-surface-raised px-2.5 py-1 text-xs font-medium text-text hover:bg-border disabled:opacity-50 cursor-pointer"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  {sentInvitations.map((invitation) => (
                    <div key={invitation.id} className="flex gap-3 border-b border-border px-4 py-3 last:border-b-0">
                      <Avatar
                        src={invitation.recipientAvatarUrl ?? undefined}
                        alt={invitation.recipientDisplayName}
                        size="sm"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-medium text-text">{invitation.recipientDisplayName}</p>
                          <span className="shrink-0 rounded-full bg-surface-raised px-2 py-0.5 text-[11px] font-medium text-muted">
                            {invitation.status}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-muted break-words">{invitation.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        {user && (
          <button
            onClick={() => navigate(`/profile/${user.username}`)}
            className="rounded-full focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
            aria-label="My profile"
          >
            <Avatar src={avatarUrl ?? undefined} alt={user.displayName ?? user.username} status={statusAvatarMap[status]} />
          </button>
        )}
      </div>
    </header>
  )
}
