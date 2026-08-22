import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { PostCard } from '../components/PostCard'
import { Button } from '../components/ui/Button'
import { getProfilePosts } from '../api/profilesApi'
import { type PostFeedItem } from '../api/postsApi'
import { useAuth } from '../context/AuthContext'

export default function HomePage() {
  const navigate = useNavigate()
  const { user, token } = useAuth()
  const [posts, setPosts] = useState<PostFeedItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    getProfilePosts(user.username, token)
      .then(setPosts)
      .catch(() => setError('Failed to load your posts.'))
      .finally(() => setIsLoading(false))
  }, [user])

  const handleDelete = useCallback((postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId))
  }, [])

  const handleUpdate = useCallback((updated: PostFeedItem) => {
    setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
  }, [])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text">Home</h1>
        <Button onClick={() => navigate('/create-post')}>Create Post</Button>
      </div>

      {isLoading && <p className="text-muted">Loading…</p>}
      {error && <p className="text-frustrated">{error}</p>}
      {!isLoading && !error && posts.length === 0 && (
        <p className="text-muted">You haven't posted anything yet — share your first moment!</p>
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
