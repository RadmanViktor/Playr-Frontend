import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Mail } from 'lucide-react'
import { IconButton } from '../ui/IconButton'
import { Avatar } from '../ui/Avatar'
import { useAuth } from '../../context/AuthContext'
import { searchProfiles, type ProfileSearchResult } from '../../api/profilesApi'
import { Search } from 'lucide-react'

export function TopBar() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ProfileSearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [noResults, setNoResults] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

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
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-surface-raised transition-colors"
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
        <IconButton aria-label="Messages">
          <Mail className="h-5 w-5" aria-hidden="true" />
        </IconButton>
        {user && <Avatar alt={user.displayName ?? user.username} status="online" />}
      </div>
    </header>
  )
}
