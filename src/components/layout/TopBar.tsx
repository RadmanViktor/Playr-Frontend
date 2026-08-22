import { Bell, Mail } from 'lucide-react'
import { SearchInput } from '../ui/SearchInput'
import { IconButton } from '../ui/IconButton'
import { Avatar } from '../ui/Avatar'
import { useAuth } from '../../context/AuthContext'

export function TopBar() {
  const { user } = useAuth()

  return (
    <header className="flex items-center gap-4 border-b border-border bg-surface px-6 py-3">
      <div className="w-full max-w-md">
        <SearchInput />
      </div>
      <div className="ml-auto flex items-center gap-2">
        <IconButton aria-label="Notifications">
          <Bell className="h-5 w-5" aria-hidden="true" />
        </IconButton>
        <IconButton aria-label="Messages">
          <Mail className="h-5 w-5" aria-hidden="true" />
        </IconButton>
        {user && <Avatar alt={user.displayName ?? user.username} status="online" />}
      </div>
    </header>
  )
}
