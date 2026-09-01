import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getFriends, type Friend } from '../api/friendsApi'
import { Avatar } from './ui/Avatar'

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export interface MentionDraft {
  userId: string
  username: string
  displayName: string
}

interface MentionInputProps {
  value: string
  mentions: MentionDraft[]
  onChange: (value: string, mentions: MentionDraft[]) => void
  placeholder?: string
  maxLength?: number
  className?: string
  ariaLabel: string
  rightSlot?: React.ReactNode
}

/**
 * A textarea that opens a friend-only autocomplete dropdown whenever the text
 * immediately before the cursor matches `@<partial username>`. Selecting a
 * friend inserts `@username` (usernames never contain spaces, so this is
 * unambiguous) and tracks the mention in a side list the parent sends along
 * with the create/update request as `mentionedUserIds`.
 */
export function MentionInput({
  value,
  mentions,
  onChange,
  placeholder,
  maxLength,
  className,
  ariaLabel,
  rightSlot,
}: MentionInputProps) {
  const { token } = useAuth()
  const [friends, setFriends] = useState<Friend[]>([])
  const [query, setQuery] = useState<string | null>(null)
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!token) return
    let cancelled = false
    getFriends(token)
      .then((result) => {
        if (!cancelled) setFriends(result)
      })
      .catch(() => {
        /* autocomplete just won't offer anyone if this fails */
      })
    return () => {
      cancelled = true
    }
  }, [token])

  const matches =
    query === null
      ? []
      : friends
          .filter(
            (friend) =>
              friend.username.toLowerCase().startsWith(query.toLowerCase()) ||
              friend.displayName.toLowerCase().includes(query.toLowerCase()),
          )
          .slice(0, 5)

  function updateQueryFromCaret(text: string, caretPosition: number) {
    const beforeCaret = text.slice(0, caretPosition)
    const match = /@(\w*)$/.exec(beforeCaret)
    setQuery(match ? match[1] : null)
    setHighlightedIndex(0)
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const nextValue = e.target.value
    // Drop mentions whose @username token no longer appears verbatim in the text
    // (e.g. the user deleted/edited it), so stale entries can't sneak into the request.
    // Match the full token (not a substring of a longer username) using a word
    // boundary, since \w in a regex already matches the same characters usernames
    // are restricted to.
    const stillPresent = mentions.filter((m) =>
      new RegExp(`@${escapeRegExp(m.username)}\\b`).test(nextValue),
    )
    onChange(nextValue, stillPresent)
    updateQueryFromCaret(nextValue, e.target.selectionStart ?? nextValue.length)
  }

  function handleSelectFriend(friend: Friend) {
    const textarea = textareaRef.current
    const caretPosition = textarea?.selectionStart ?? value.length
    const beforeCaret = value.slice(0, caretPosition)
    const afterCaret = value.slice(caretPosition)
    const replaced = beforeCaret.replace(/@(\w*)$/, `@${friend.username} `)
    const nextValue = replaced + afterCaret

    onChange(nextValue, [
      ...mentions.filter((m) => m.userId !== friend.userId),
      { userId: friend.userId, username: friend.username, displayName: friend.displayName },
    ])
    setQuery(null)

    requestAnimationFrame(() => {
      const nextCaret = replaced.length
      textarea?.focus()
      textarea?.setSelectionRange(nextCaret, nextCaret)
    })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (matches.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex((i) => (i + 1) % matches.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex((i) => (i - 1 + matches.length) % matches.length)
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault()
      handleSelectFriend(matches[highlightedIndex])
    } else if (e.key === 'Escape') {
      setQuery(null)
    }
  }

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        aria-label={ariaLabel}
        placeholder={placeholder}
        className={className}
        value={value}
        maxLength={maxLength}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={() => setTimeout(() => setQuery(null), 150)}
      />
      {rightSlot}
      {query !== null && matches.length > 0 && (
        <div className="absolute left-0 top-full z-50 mt-1 w-56 rounded-lg border border-border bg-surface shadow-lg overflow-hidden">
          {matches.map((friend, index) => (
            <button
              key={friend.userId}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelectFriend(friend)}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm cursor-pointer ${
                index === highlightedIndex ? 'bg-surface-raised' : 'hover:bg-surface-raised'
              }`}
            >
              <Avatar src={friend.avatarUrl ?? undefined} alt={friend.displayName} size="sm" />
              <div className="min-w-0">
                <p className="truncate font-medium text-text">{friend.displayName}</p>
                <p className="truncate text-xs text-muted">@{friend.username}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
