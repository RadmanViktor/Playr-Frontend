import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { PostCard } from '../components/PostCard'
import { Button } from '../components/ui/Button'
import { getProfilePosts } from '../api/profilesApi'
import { type PostFeedItem } from '../api/postsApi'
import { useAuth } from '../context/AuthContext'
import { useCreatePostModal } from '../context/CreatePostModalContext'

export default function HomePage() {
  const { t } = useTranslation('pagesA')
  const { user, token } = useAuth()
  const { openCreatePost, subscribePostCreated } = useCreatePostModal()
  const [posts, setPosts] = useState<PostFeedItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    getProfilePosts(user.username, token)
      .then(setPosts)
      .catch(() => setError(t('home.loadError')))
      .finally(() => setIsLoading(false))
  }, [user])

  useEffect(() => {
    return subscribePostCreated((post) => {
      if (post.authorId === user?.id && post.scope === 'Profile') {
        setPosts((prev) => [post, ...prev])
      }
    })
  }, [subscribePostCreated, user])

  const handleDelete = useCallback((postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId))
  }, [])

  const handleUpdate = useCallback((updated: PostFeedItem) => {
    setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
  }, [])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-end">
        <Button onClick={() => openCreatePost('Profile')}>{t('home.createPost')}</Button>
      </div>

      {isLoading && <p className="text-muted">{t('home.loading')}</p>}
      {error && <p className="text-frustrated">{error}</p>}
      {!isLoading && !error && posts.length === 0 && (
        <p className="text-muted">{t('home.emptyState')}</p>
      )}
      {posts.map((post) => (
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
