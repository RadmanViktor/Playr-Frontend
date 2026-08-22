import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ProfileHeader } from '../components/ProfileHeader'
import { PostCard } from '../components/PostCard'
import { getProfile, getProfilePosts, type ProfileData } from '../api/profilesApi'
import { type PostFeedItem } from '../api/postsApi'
import { ApiError } from '../api/http'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/Button'
import { Settings } from 'lucide-react'

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [posts, setPosts] = useState<PostFeedItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!username) return
    setIsLoading(true)
    setNotFound(false)
    setError(null)

    Promise.all([getProfile(username), getProfilePosts(username)])
      .then(([p, ps]) => { setProfile(p); setPosts(ps) })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) setNotFound(true)
        else setError('Failed to load profile.')
      })
      .finally(() => setIsLoading(false))
  }, [username])

  const isOwner = !!user && !!profile && user.id === profile.userId

  if (isLoading) return <p className="text-muted">Loading…</p>
  if (notFound) return <p className="text-muted">Profile not found.</p>
  if (error) return <p className="text-frustrated">{error}</p>
  if (!profile) return null

  return (
    <div className="flex flex-col gap-4">
      <ProfileHeader
        profile={profile}
        isOwner={false}
        onEditClick={() => {}}
      />

      {isOwner && (
        <div className="flex justify-end">
          <Button variant="secondary" size="sm" onClick={() => navigate('/settings')}>
            <Settings className="h-4 w-4" aria-hidden="true" />
            Edit Profile
          </Button>
        </div>
      )}

      <h2 className="text-lg font-semibold text-text">Posts</h2>
      {posts.length === 0 ? (
        <p className="text-muted">No posts yet.</p>
      ) : (
        posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            currentUserId={user?.id}
            onUpdate={(updated) => setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))}
            onDelete={(postId) => setPosts((prev) => prev.filter((p) => p.id !== postId))}
          />
        ))
      )}
    </div>
  )
}
