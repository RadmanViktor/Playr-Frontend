import { useEffect, useState, useCallback, useMemo } from 'react'
import { PostCard } from '../components/PostCard'
import { getFeed, type PostFeedItem } from '../api/postsApi'
import { getGames, type Game } from '../api/gamesApi'
import { useAuth } from '../context/AuthContext'
import { useCreatePostModal } from '../context/CreatePostModalContext'

export default function FeedPage() {
  const { user, token } = useAuth()
  const { subscribePostCreated } = useCreatePostModal()
  const [posts, setPosts] = useState<PostFeedItem[]>([])
  const [games, setGames] = useState<Game[]>([])
  const [selectedGameId, setSelectedGameId] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([getFeed(token), getGames()])
      .then(([p, g]) => { setPosts(p); setGames(g) })
      .catch(() => setError('Failed to load feed.'))
      .finally(() => setIsLoading(false))
  }, [])

  useEffect(() => {
    return subscribePostCreated((post) => {
      setPosts((prev) => [post, ...prev])
    })
  }, [subscribePostCreated])

  const handleDelete = useCallback((postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId))
  }, [])

  const handleUpdate = useCallback((updated: PostFeedItem) => {
    setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
  }, [])

  const gamesInFeed = useMemo(() => {
    const idsInFeed = new Set(posts.map((p) => p.gameId))
    return games.filter((g) => idsInFeed.has(g.id))
  }, [games, posts])

  const filteredPosts = useMemo(() => {
    if (selectedGameId === 'all') return posts
    return posts.filter((p) => p.gameId === selectedGameId)
  }, [posts, selectedGameId])

  return (
    <div className="flex flex-col gap-4">
      {gamesInFeed.length > 0 && (
        <div className="flex items-center justify-end">
          <select
            aria-label="Filter by game"
            value={selectedGameId}
            onChange={(e) => setSelectedGameId(e.target.value)}
            className="rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-text outline-none focus:border-primary"
          >
            <option value="all">All games</option>
            {gamesInFeed.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
      )}

      {isLoading && <p className="text-muted">Loading…</p>}
      {error && <p className="text-frustrated">{error}</p>}
      {!isLoading && !error && filteredPosts.length === 0 && (
        <p className="text-muted">
          {posts.length === 0 ? 'No posts yet — be the first to share!' : 'No posts for this game.'}
        </p>
      )}
      {filteredPosts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          currentUserId={user?.id}
          onDelete={handleDelete}
          onUpdate={handleUpdate}
        />
      ))}
    </div>
  )
}
