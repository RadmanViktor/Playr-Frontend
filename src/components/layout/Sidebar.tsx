import { NavLink, useNavigate } from 'react-router-dom'
import { Home, Users, MessageSquare, Plus } from 'lucide-react'
import { Button } from '../ui/Button'
import { Avatar } from '../ui/Avatar'
import { useAuth } from '../../context/AuthContext'

const navItems = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/find-players', label: 'Find Players', icon: Users, end: false },
  { to: '/threads', label: 'Threads', icon: MessageSquare, end: false },
]

export function Sidebar() {
  const { user } = useAuth()
  const navigate = useNavigate()

  return (
    <aside className="flex w-64 shrink-0 flex-col gap-6 border-r border-border bg-surface p-4">
      <div className="flex items-center gap-2 px-2">
        <span className="text-2xl font-bold tracking-tight text-primary">PLAYR</span>
      </div>

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
          </NavLink>
        ))}
      </nav>

      <Button className="w-full" onClick={() => navigate('/create-post')}>
        <Plus className="h-4 w-4" aria-hidden="true" />
        Create Post
      </Button>

      {user && (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-raised p-3">
          <Avatar alt={user.displayName ?? user.username} status="online" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-text">{user.username}</p>
            <p className="text-xs text-enjoying">Online</p>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-surface-raised p-4">
        <p className="text-sm font-semibold text-text">Level up your connections.</p>
        <p className="mt-1 text-xs text-muted">
          Find teammates, share wins, and build your squad.
        </p>
      </div>

      <Button variant="secondary" className="w-full">
        Find Players
      </Button>
    </aside>
  )
}
