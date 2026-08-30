import { useEffect, useState, useCallback, useMemo } from 'react'
import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PostCard } from '../components/PostCard'
import { getFeed, type PostFeedItem } from '../api/postsApi'
import { getGames, type Game } from '../api/gamesApi'
import { useAuth } from '../context/AuthContext'
import { useCreatePostModal } from '../context/CreatePostModalContext'
import { Select } from '../components/ui/Select'

export default function FeedPage() {
  const { t } = useTranslation('pagesA')
  const { user, token } = useAuth()
  const { openCreatePost, subscribePostCreated } = useCreatePostModal()
  const [posts, setPosts] = useState<PostFeedItem[]>([])
  const [games, setGames] = useState<Game[]>([])
  const [selectedGameId, setSelectedGameId] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([getFeed(token), getGames()])
      .then(([p, g]) => { setPosts(p); setGames(g) })
      .catch(() => setError(t('feed.loadError')))
      .finally(() => setIsLoading(false))
  }, [])

  useEffect(() => {
    return subscribePostCreated((post) => {
      if (post.scope === 'Feed') {
        setPosts((prev) => [post, ...prev])
      }
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
    <div className="flex flex-col gap-4 pb-20 md:pb-0">
      <div className="mb-2 border-l-4 border-primary pl-4">
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary">{t('feed.eyebrow')}</p>
        <h1 className="text-3xl font-bold tracking-tight text-text">{t('feed.title')}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          {t('feed.subtitle')}
        </p>
      </div>

      {gamesInFeed.length > 0 && (
        <div className="flex items-center justify-end">
          <Select
            aria-label={t('feed.filterByGame')}
            value={selectedGameId}
            onChange={setSelectedGameId}
            className="w-auto"
            options={[
              { value: 'all', label: t('feed.allGames') },
              ...gamesInFeed.map((g) => ({ value: g.id, label: g.name })),
            ]}
          />
        </div>
      )}

      {isLoading && <p className="text-muted">{t('feed.loading')}</p>}
      {error && <p className="text-frustrated">{error}</p>}
      {!isLoading && !error && filteredPosts.length === 0 && (
        <p className="text-muted">
          {posts.length === 0 ? t('feed.emptyStateNoPosts') : t('feed.emptyStateNoGamePosts')}
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

      <button
        type="button"
        aria-label={t('feed.createPost')}
        onClick={() => openCreatePost('Feed')}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-transform hover:scale-105 active:scale-95 md:hidden"
      >
        <Plus className="h-6 w-6" aria-hidden="true" />
      </button>
    </div>
  )
}
