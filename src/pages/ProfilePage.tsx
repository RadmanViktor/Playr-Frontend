import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ProfileHeader } from '../components/ProfileHeader'
import { PostCard } from '../components/PostCard'
import { SteamGamesList } from '../components/SteamGamesList'
import { InviteModal } from '../components/ui/InviteModal'
import { getProfile, getProfilePosts, type ProfileData } from '../api/profilesApi'
import { type PostFeedItem } from '../api/postsApi'
import { ApiError } from '../api/http'
import { useAuth } from '../context/AuthContext'

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>()
  const { user, token, logout } = useAuth()
  const navigate = useNavigate()

  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [posts, setPosts] = useState<PostFeedItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'posts' | 'games'>('posts')
  const [showFriendRequestModal, setShowFriendRequestModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!username) return
    setIsLoading(true)
    setNotFound(false)
    setError(null)

    Promise.all([getProfile(username, token), getProfilePosts(username, token)])
      .then(([p, ps]) => { setProfile(p); setPosts(ps) })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) setNotFound(true)
        else setError('Failed to load profile.')
      })
      .finally(() => setIsLoading(false))
  }, [username, token])

  const isOwner = !!user && !!profile && user.id === profile.userId

  function handleSignOut() {
    logout()
    navigate('/login', { replace: true })
  }

  function handleFriendRequestSent() {
    setProfile((prev) => (prev ? { ...prev, relationshipStatus: 'InvitePending' } : prev))
    setSuccessMessage('Friend request sent.')
  }

  useEffect(() => {
    if (!successMessage) return
    const timeoutId = setTimeout(() => setSuccessMessage(null), 5000)
    return () => clearTimeout(timeoutId)
  }, [successMessage])

  function handleTabChange(tab: 'posts' | 'games') {
    if (tab === activeTab) return
    const applyChange = () => setActiveTab(tab)
    const doc = document as Document & {
      startViewTransition?: (callback: () => void) => void
    }
    if (typeof doc.startViewTransition === 'function') {
      doc.startViewTransition(applyChange)
    } else {
      applyChange()
    }
  }

  if (isLoading) return <p className="text-muted">Loading…</p>
  if (notFound) return <p className="text-muted">Profile not found.</p>
  if (error) return <p className="text-frustrated">{error}</p>
  if (!profile) return null

  return (
    <div className="flex flex-col gap-4">
      <ProfileHeader
        profile={profile}
        isOwner={isOwner}
        onEditClick={() => navigate('/settings')}
        onSignOutClick={handleSignOut}
        postCount={posts.length}
        onAddFriendClick={() => setShowFriendRequestModal(true)}
      />

      {successMessage && (
        <div className="rounded-xl border border-enjoying/40 bg-enjoying/10 px-4 py-3 text-sm text-enjoying">
          {successMessage}
        </div>
      )}

      <div className="relative flex gap-2 rounded-lg border border-border bg-surface-raised p-1">
        <div
          className={`absolute inset-y-1 w-[calc(50%-0.25rem)] rounded-md bg-primary shadow-sm transition-transform duration-300 ease-out ${
            activeTab === 'games' ? 'translate-x-[calc(100%+0.5rem)]' : 'translate-x-0'
          }`}
          aria-hidden
        />
        <button
          className={`relative z-10 flex-1 rounded-md px-4 py-2 text-base font-semibold transition-colors duration-300 ${
            activeTab === 'posts' ? 'text-white' : 'text-muted hover:text-text'
          }`}
          onClick={() => handleTabChange('posts')}
        >
          Posts
        </button>
        <button
          className={`relative z-10 flex-1 rounded-md px-4 py-2 text-base font-semibold transition-colors duration-300 ${
            activeTab === 'games' ? 'text-white' : 'text-muted hover:text-text'
          }`}
          onClick={() => handleTabChange('games')}
        >
          Games
        </button>
      </div>

      <div key={activeTab} className="animate-tab-content flex flex-col gap-4">
        {activeTab === 'posts' ? (
          posts.length === 0 ? (
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
          )
        ) : (
          <SteamGamesList userId={profile.userId} />
        )}
      </div>

      {showFriendRequestModal && (
        <InviteModal
          recipientUserId={profile.userId}
          recipientDisplayName={profile.displayName}
          recipientAvatarUrl={profile.avatarUrl}
          title="Send friend request"
          promptText="Send a friend request to"
          promptSuffix=""
          placeholderText="Say hi and introduce yourself..."
          actionLabel="Send request"
          onClose={() => setShowFriendRequestModal(false)}
          onSent={handleFriendRequestSent}
        />
      )}
    </div>
  )
}
