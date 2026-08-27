import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Rss, Users, MessageSquare, Plus, UserRoundCheck } from 'lucide-react'
import { Button } from '../ui/Button'
import { Avatar, type AvatarStatus } from '../ui/Avatar'
import { StatusModal } from '../ui/StatusModal'
import { useAuth } from '../../context/AuthContext'
import { useStatus } from '../../context/StatusContext'
import { useChat } from '../../context/ChatContext'
import { useCreatePostModal } from '../../context/CreatePostModalContext'
import type { ProfileStatus } from '../../api/profilesApi'

const navItems = [
  { to: '/feed', label: 'Feed', icon: Rss, end: false },
  { to: '/find-players', label: 'Find Players', icon: Users, end: false },
  { to: '/chats', label: 'Chats', icon: MessageSquare, end: false },
  { to: '/friends', label: 'Friends', icon: UserRoundCheck, end: false },
]

const statusAvatarMap: Record<ProfileStatus, AvatarStatus> = {
  Online: 'online',
  LookingForGame: 'looking-for-game',
  Busy: 'busy',
  Offline: 'offline',
}

const statusLabelMap: Record<ProfileStatus, string> = {
  Online: 'Online',
  LookingForGame: 'Looking for game',
  Busy: 'Busy',
  Offline: 'Offline',
}

const statusTextColorMap: Record<ProfileStatus, string> = {
  Online: 'text-enjoying',
  LookingForGame: 'text-need-help',
  Busy: 'text-frustrated',
  Offline: 'text-muted',
}

export function Sidebar() {
  const { user } = useAuth()
  const { status, avatarUrl, lookingForGameName } = useStatus()
  const { hasUnread } = useChat()
  const { openCreatePost } = useCreatePostModal()
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)

  return (
    <aside className="flex w-64 shrink-0 flex-col gap-6 border-r border-border bg-surface p-4">
      <div className="flex items-center gap-2 px-2">
        <span className="text-2xl font-bold tracking-tight text-primary">PLAYR</span>
      </div>

      {user && (
        <button
          type="button"
          onClick={() => setIsStatusModalOpen(true)}
          className="flex items-center gap-3 rounded-xl border border-border bg-surface-raised p-3 text-left transition-colors hover:bg-border cursor-pointer"
        >
          <Avatar src={avatarUrl ?? undefined} alt={user.displayName ?? user.username} status={statusAvatarMap[status]} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-text">{user.username}</p>
            <p className={`truncate text-xs ${statusTextColorMap[status]}`}>
              {status === 'LookingForGame' && lookingForGameName
                ? `Looking for ${lookingForGameName}`
                : statusLabelMap[status]}
            </p>
          </div>
        </button>
      )}

      <nav className="flex flex-col gap-1">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary text-white'
                  : 'text-muted hover:bg-surface-raised hover:text-text'
              }`
            }
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
            {label}
            {to === '/chats' && hasUnread && (
              <span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-frustrated" aria-label="Unread messages" />
            )}
          </NavLink>
        ))}
      </nav>

      <Button className="w-full" onClick={openCreatePost}>
        <Plus className="h-4 w-4" aria-hidden="true" />
        Create Post
      </Button>

      {isStatusModalOpen && <StatusModal onClose={() => setIsStatusModalOpen(false)} />}
    </aside>
  )
}
