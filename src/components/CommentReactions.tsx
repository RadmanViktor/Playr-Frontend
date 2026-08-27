import { useEffect, useRef, useState } from 'react'
import { SmilePlus } from 'lucide-react'
import type { CommentReactions as CommentReactionsType, ReactionType } from '../api/commentsApi'

const REACTION_EMOJI: Record<ReactionType, string> = {
  Like: '👍',
  Haha: '😂',
  Wow: '😮',
  Sad: '😢',
  Angry: '😡',
}

const REACTION_TYPES: ReactionType[] = ['Like', 'Haha', 'Wow', 'Sad', 'Angry']

const COUNT_KEY: Record<ReactionType, keyof CommentReactionsType['counts']> = {
  Like: 'like',
  Haha: 'haha',
  Wow: 'wow',
  Sad: 'sad',
  Angry: 'angry',
}

interface CommentReactionsProps {
  reactions: CommentReactionsType
  canReact: boolean
  onReact: (type: ReactionType) => void
  onRemoveReaction: () => void
}

export function CommentReactions({ reactions, canReact, onReact, onRemoveReaction }: CommentReactionsProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [open])

  function handlePick(type: ReactionType) {
    setOpen(false)
    if (reactions.currentUserReaction === type) {
      onRemoveReaction()
    } else {
      onReact(type)
    }
  }

  const activeCounts = REACTION_TYPES
    .map((type) => ({ type, count: reactions.counts[COUNT_KEY[type]] }))
    .filter(({ count }) => count > 0)

  return (
    <div className="flex items-center gap-2">
      {canReact && (
        <div className="relative" ref={containerRef}>
          <button
            type="button"
            aria-label="React to comment"
            aria-pressed={reactions.currentUserReaction != null}
            onClick={() => setOpen((o) => !o)}
            className={`flex items-center justify-center rounded-lg p-1 transition-colors cursor-pointer ${
              reactions.currentUserReaction != null ? 'text-primary' : 'text-muted hover:text-text'
            }`}
          >
            <SmilePlus className="h-4 w-4" aria-hidden="true" />
          </button>
          {open && (
            <div className="absolute bottom-full left-0 z-20 mb-2 flex items-center gap-1 rounded-lg border border-border bg-surface-raised p-1.5 shadow-lg">
              {REACTION_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  aria-label={type}
                  aria-pressed={reactions.currentUserReaction === type}
                  onClick={() => handlePick(type)}
                  className={`rounded-lg p-1 text-lg transition-transform hover:scale-125 cursor-pointer ${
                    reactions.currentUserReaction === type ? 'bg-surface' : ''
                  }`}
                >
                  {REACTION_EMOJI[type]}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      {activeCounts.map(({ type, count }) => {
        const isMine = reactions.currentUserReaction === type
        return (
          <button
            key={type}
            type="button"
            disabled={!canReact}
            aria-pressed={isMine}
            aria-label={isMine ? `Remove ${type} reaction` : undefined}
            onClick={() => isMine && onRemoveReaction()}
            className={`flex items-center gap-1 rounded-full px-1.5 py-0.5 text-xs transition-colors ${
              isMine ? 'bg-surface-raised text-primary cursor-pointer hover:bg-surface' : 'text-muted'
            } ${canReact && !isMine ? 'cursor-default' : ''}`}
          >
            <span aria-hidden="true">{REACTION_EMOJI[type]}</span>
            {count}
          </button>
        )
      })}
    </div>
  )
}
