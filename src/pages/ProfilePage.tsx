import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ProfileHeader } from '../components/ProfileHeader'
import { PostCard } from '../components/PostCard'
import { SteamGamesList } from '../components/SteamGamesList'
import { MyGamesLibrary } from '../components/MyGamesLibrary'
import { getProfile, getProfilePosts, type ProfileData } from '../api/profilesApi'
import {
  sendFriendRequest,
  cancelFriendRequest,
  getSentFriendRequests,
} from '../api/friendRequestsApi'
import { type PostFeedItem } from '../api/postsApi'
import { ApiError } from '../api/http'
import { useAuth } from '../context/AuthContext'
import { useChat } from '../context/ChatContext'

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>()
  const { user, token, logout } = useAuth()
  const { openChatWithUser } = useChat()
  const navigate = useNavigate()

  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [posts, setPosts] = useState<PostFeedItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'posts' | 'games' | 'library'>('posts')
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [pendingFriendRequestId, setPendingFriendRequestId] = useState<string | null>(null)
  const [isSendingFriendRequest, setIsSendingFriendRequest] = useState(false)
  const [isCancellingFriendRequest, setIsCancellingFriendRequest] = useState(false)
  const [friendRequestError, setFriendRequestError] = useState<string | null>(null)

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

  useEffect(() => {
    if (!token || !profile || !user || user.id === profile.userId) {
      setPendingFriendRequestId(null)
      return
    }
    let cancelled = false
    getSentFriendRequests(token)
      .then((requests) => {
        if (cancelled) return
        const pending = requests.find(
          (r) => r.status === 'Pending' && r.recipientUserId === profile.userId,
        )
        setPendingFriendRequestId(pending?.id ?? null)
      })
      .catch(() => {
        /* ignore - non-critical */
      })
    return () => {
      cancelled = true
    }
  }, [token, profile, user])

  const isOwner = !!user && !!profile && user.id === profile.userId

  function handleSignOut() {
    logout()
    navigate('/login', { replace: true })
  }

  async function handleAddFriend() {
    if (!token || !profile) return
    setIsSendingFriendRequest(true)
    setFriendRequestError(null)
    try {
      const request = await sendFriendRequest(token, profile.userId)
      setPendingFriendRequestId(request.id)
      setSuccessMessage('Friend request sent.')
    } catch (err) {
      setFriendRequestError(err instanceof ApiError ? err.message : 'Failed to send friend request.')
    } finally {
      setIsSendingFriendRequest(false)
    }
  }

  async function handleCancelFriendRequest() {
    if (!token || !pendingFriendRequestId) return
    setIsCancellingFriendRequest(true)
    setFriendRequestError(null)
    try {
      await cancelFriendRequest(token, pendingFriendRequestId)
      setPendingFriendRequestId(null)
      setSuccessMessage('Friend request cancelled.')
    } catch (err) {
      setFriendRequestError(err instanceof ApiError ? err.message : 'Failed to cancel friend request.')
    } finally {
      setIsCancellingFriendRequest(false)
    }
  }

  async function handleMessageClick() {
    if (!profile) return
    await openChatWithUser(profile.userId)
  }

  useEffect(() => {
    if (!successMessage) return
    const timeoutId = setTimeout(() => setSuccessMessage(null), 5000)
    return () => clearTimeout(timeoutId)
  }, [successMessage])

  function handleTabChange(tab: 'posts' | 'games' | 'library') {
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
        onAddFriendClick={handleAddFriend}
        onCancelFriendRequestClick={handleCancelFriendRequest}
        isCancellingFriendRequest={isCancellingFriendRequest}
        isFriendRequestPending={!!pendingFriendRequestId || isSendingFriendRequest}
        onMessageClick={handleMessageClick}
      />

      {successMessage && (
        <div className="rounded-xl border border-enjoying/40 bg-enjoying/10 px-4 py-3 text-sm text-enjoying">
          {successMessage}
        </div>
      )}

      {friendRequestError && (
        <div className="rounded-xl border border-frustrated/40 bg-frustrated/10 px-4 py-3 text-sm text-frustrated">
          {friendRequestError}
        </div>
      )}

      <div className="relative flex gap-2 rounded-lg border border-border bg-surface-raised p-1">
        <div
          className={`absolute inset-y-1 w-[calc(33.333%-0.334rem)] rounded-md bg-primary shadow-sm transition-transform duration-300 ease-out ${
            activeTab === 'games'
              ? 'translate-x-[calc(100%+0.5rem)]'
              : activeTab === 'library'
                ? 'translate-x-[calc(200%+1rem)]'
                : 'translate-x-0'
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
          Steam
        </button>
        <button
          className={`relative z-10 flex-1 rounded-md px-4 py-2 text-base font-semibold transition-colors duration-300 ${
            activeTab === 'library' ? 'text-white' : 'text-muted hover:text-text'
          }`}
          onClick={() => handleTabChange('library')}
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
        ) : activeTab === 'games' ? (
          <SteamGamesList userId={profile.userId} />
        ) : (
          <MyGamesLibrary username={profile.username} isOwner={isOwner} />
        )}
      </div>
    </div>
  )
}
