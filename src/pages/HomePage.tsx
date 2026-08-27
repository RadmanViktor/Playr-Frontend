import { useEffect, useState, useCallback } from 'react'
import { PostCard } from '../components/PostCard'
import { Button } from '../components/ui/Button'
import { getProfilePosts } from '../api/profilesApi'
import { type PostFeedItem } from '../api/postsApi'
import { useAuth } from '../context/AuthContext'
import { useCreatePostModal } from '../context/CreatePostModalContext'

export default function HomePage() {
  const { user, token } = useAuth()
  const { openCreatePost, subscribePostCreated } = useCreatePostModal()
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

  useEffect(() => {
    return subscribePostCreated((post) => {
      if (post.authorId === user?.id) {
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
        <Button onClick={openCreatePost}>Create Post</Button>
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
