import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import { ProfileHeader } from '../components/ProfileHeader'
import { PostCard } from '../components/PostCard'
import { MyGamesLibrary } from '../components/MyGamesLibrary'
import { PlayingNowSection } from '../components/PlayingNowSection'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { FollowListModal } from '../components/ui/FollowListModal'
import { getProfile, getProfilePosts, type ProfileData } from '../api/profilesApi'
import {
  sendFriendRequest,
  cancelFriendRequest,
  getSentFriendRequests,
} from '../api/friendRequestsApi'
import { getFriendsCount } from '../api/friendsApi'
import {
  followUser,
  unfollowUser,
  getFollowStatus,
  getFollowCounts,
} from '../api/followApi'
import { type PostFeedItem } from '../api/postsApi'
import { getSteamStatus, type SteamAccount } from '../api/steamApi'
import { ApiError } from '../api/http'
import { useAuth } from '../context/AuthContext'
import { useChat } from '../context/ChatContext'
import { useCreatePostModal } from '../context/CreatePostModalContext'
import { onFollowReceived, onFollowRemoved } from '../lib/chatHubConnection'

type ProfileTab = 'overview' | 'posts' | 'games' | 'about'
const PROFILE_TABS: ProfileTab[] = ['overview', 'posts', 'games', 'about']

export default function ProfilePage() {
  const { t } = useTranslation('pagesA')
  const { t: tOnboarding } = useTranslation('pagesB')
  const { username } = useParams<{ username: string }>()
  const { user, token } = useAuth()
  const { openChatWithUser } = useChat()
  const { openCreatePost, subscribePostCreated } = useCreatePostModal()

  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [posts, setPosts] = useState<PostFeedItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<ProfileTab>('overview')
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [pendingFriendRequestId, setPendingFriendRequestId] = useState<string | null>(null)
  const [isSendingFriendRequest, setIsSendingFriendRequest] = useState(false)
  const [isCancellingFriendRequest, setIsCancellingFriendRequest] = useState(false)
  const [friendRequestError, setFriendRequestError] = useState<string | null>(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const [isFollowLoading, setIsFollowLoading] = useState(false)
  const [followersCount, setFollowersCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [friendsCount, setFriendsCount] = useState(0)
  const [followError, setFollowError] = useState<string | null>(null)
  const [followListModal, setFollowListModal] = useState<'followers' | 'following' | null>(null)
  const [steamAccount, setSteamAccount] = useState<SteamAccount | null>(null)

  useEffect(() => {
    if (!username) return
    setIsLoading(true)
    setNotFound(false)
    setError(null)

    Promise.all([getProfile(username, token), getProfilePosts(username, token)])
      .then(([p, ps]) => { setProfile(p); setPosts(ps) })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) setNotFound(true)
        else setError(t('profile.loadError'))
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

  useEffect(() => {
    if (!token || !isOwner) {
      setSteamAccount(null)
      return
    }
    let cancelled = false
    getSteamStatus(token)
      .then((account) => {
        if (!cancelled) setSteamAccount(account)
      })
      .catch(() => {
        /* ignore - non-critical */
      })
    return () => {
      cancelled = true
    }
  }, [token, isOwner])

  useEffect(() => {
    if (!token || !profile) return
    let cancelled = false
    getFollowCounts(token, profile.userId)
      .then((counts) => {
        if (cancelled) return
        setFollowersCount(counts.followersCount)
        setFollowingCount(counts.followingCount)
      })
      .catch(() => {
        /* ignore - non-critical */
      })
    getFriendsCount(token, profile.userId)
      .then((counts) => {
        if (!cancelled) setFriendsCount(counts.friendsCount)
      })
      .catch(() => {
        /* ignore - non-critical */
      })
    if (!user || user.id === profile.userId) {
      setIsFollowing(false)
      return () => {
        cancelled = true
      }
    }
    getFollowStatus(token, profile.userId)
      .then((status) => {
        if (!cancelled) setIsFollowing(status.isFollowing)
      })
      .catch(() => {
        /* ignore - non-critical */
      })
    return () => {
      cancelled = true
    }
  }, [token, profile, user])

  useEffect(() => {
    if (!profile) return
    return subscribePostCreated((post) => {
      if (post.scope === 'Profile' && post.authorId === profile.userId) {
        setPosts((prev) => [post, ...prev])
      }
    })
  }, [subscribePostCreated, profile])

  useEffect(() => {
    if (!profile) return
    const unsubscribeReceived = onFollowReceived((event) => {
      if (event.followingUserId === profile.userId) {
        setFollowersCount((prev) => prev + 1)
      }
      if (user && event.followerUserId === profile.userId && event.followingUserId === user.id) {
        setIsFollowing(true)
      }
    })
    const unsubscribeRemoved = onFollowRemoved((event) => {
      if (event.followingUserId === profile.userId) {
        setFollowersCount((prev) => Math.max(0, prev - 1))
      }
    })
    return () => {
      unsubscribeReceived()
      unsubscribeRemoved()
    }
  }, [profile, user])

  async function handleAddFriend() {
    if (!token || !profile) return
    setIsSendingFriendRequest(true)
    setFriendRequestError(null)
    try {
      const request = await sendFriendRequest(token, profile.userId)
      setPendingFriendRequestId(request.id)
      setSuccessMessage(t('profile.friendRequestSent'))
    } catch (err) {
      setFriendRequestError(err instanceof ApiError ? err.message : t('profile.friendRequestSendError'))
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
      setSuccessMessage(t('profile.friendRequestCancelled'))
    } catch (err) {
      setFriendRequestError(err instanceof ApiError ? err.message : t('profile.friendRequestCancelError'))
    } finally {
      setIsCancellingFriendRequest(false)
    }
  }

  async function handleMessageClick() {
    if (!profile) return
    await openChatWithUser(profile.userId)
  }

  async function handleFollow() {
    if (!token || !profile) return
    setIsFollowLoading(true)
    setFollowError(null)
    try {
      await followUser(token, profile.userId)
      setIsFollowing(true)
      setFollowersCount((prev) => prev + 1)
    } catch (err) {
      setFollowError(err instanceof ApiError ? err.message : t('profile.followError'))
    } finally {
      setIsFollowLoading(false)
    }
  }

  async function handleUnfollow() {
    if (!token || !profile) return
    setIsFollowLoading(true)
    setFollowError(null)
    try {
      await unfollowUser(token, profile.userId)
      setIsFollowing(false)
      setFollowersCount((prev) => Math.max(0, prev - 1))
    } catch (err) {
      setFollowError(err instanceof ApiError ? err.message : t('profile.unfollowError'))
    } finally {
      setIsFollowLoading(false)
    }
  }

  useEffect(() => {
    if (!successMessage) return
    const timeoutId = setTimeout(() => setSuccessMessage(null), 5000)
    return () => clearTimeout(timeoutId)
  }, [successMessage])

  function handleTabChange(tab: ProfileTab) {
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

  if (isLoading) return <p className="text-muted">{t('profile.loading')}</p>
  if (notFound) return <p className="text-muted">{t('profile.notFound')}</p>
  if (error) return <p className="text-frustrated">{error}</p>
  if (!profile) return null

  return (
    <div className="flex flex-col gap-4">
      <ProfileHeader
        profile={profile}
        isOwner={isOwner}
        postCount={posts.length}
        onAddFriendClick={handleAddFriend}
        onCancelFriendRequestClick={handleCancelFriendRequest}
        isCancellingFriendRequest={isCancellingFriendRequest}
        isFriendRequestPending={!!pendingFriendRequestId || isSendingFriendRequest}
        onMessageClick={handleMessageClick}
        isFollowing={isFollowing}
        isFollowLoading={isFollowLoading}
        onFollowClick={handleFollow}
        onUnfollowClick={handleUnfollow}
        followersCount={followersCount}
        followingCount={followingCount}
        friendsCount={friendsCount}
        onFollowersClick={() => setFollowListModal('followers')}
        onFollowingClick={() => setFollowListModal('following')}
      />

      {followListModal && (
        <FollowListModal
          userId={profile.userId}
          mode={followListModal}
          onClose={() => setFollowListModal(null)}
        />
      )}

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

      {followError && (
        <div className="rounded-xl border border-frustrated/40 bg-frustrated/10 px-4 py-3 text-sm text-frustrated">
          {followError}
        </div>
      )}

      <div className="relative grid grid-cols-4 gap-2 rounded-lg border border-border bg-surface-raised p-1">
        <div
          className="absolute inset-y-1 w-[calc(25%-0.375rem)] rounded-md bg-primary shadow-sm transition-transform duration-300 ease-out"
          style={{ transform: `translateX(calc(${PROFILE_TABS.indexOf(activeTab)} * (100% + 0.5rem)))` }}
          aria-hidden
        />
        {PROFILE_TABS.map((tab) => (
          <button
            key={tab}
            className={`relative z-10 rounded-md px-2 py-2 text-sm font-semibold transition-colors duration-300 sm:text-base ${
              activeTab === tab ? 'text-white' : 'text-muted hover:text-text'
            }`}
            onClick={() => handleTabChange(tab)}
          >
            {t(`profile.tabs.${tab}`)}
          </button>
        ))}
      </div>

      <div key={activeTab} className="animate-tab-content flex flex-col gap-4">
        {activeTab === 'overview' && (
          <div className="flex flex-col gap-4">
            <PlayingNowSection username={profile.username} isOwner={isOwner} />

            <div className="rounded-xl border border-border bg-surface p-6">
              <h2 className="text-lg font-semibold text-text">{t('profile.overview.recentPosts')}</h2>
              <div className="mt-4 flex flex-col gap-4">
                {posts.length === 0 ? (
                  <p className="text-muted">{t('profile.overview.noPosts')}</p>
                ) : (
                  posts.slice(0, 3).map((post) => (
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
              {posts.length > 0 && (
                <div className="mt-4 flex justify-end">
                  <Button variant="secondary" size="sm" onClick={() => handleTabChange('posts')}>
                    {t('profile.overview.viewAllPosts')}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'posts' && (
          <>
            {isOwner && (
              <div className="hidden justify-end md:flex">
                <Button onClick={() => openCreatePost('Profile')}>
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  {t('profile.createPost')}
                </Button>
              </div>
            )}
            {posts.length === 0 ? (
              <p className="text-muted">{t('profile.noPosts')}</p>
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
          </>
        )}

        {activeTab === 'games' && <MyGamesLibrary username={profile.username} isOwner={isOwner} />}

        {activeTab === 'about' && (
          <div className="flex flex-col gap-4">
            <div className="rounded-xl border border-border bg-surface p-6">
              <h2 className="text-lg font-semibold text-text">{t('profile.about.gaming')}</h2>
              <div className="mt-4 flex flex-col gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted">{t('profile.about.platforms')}</h3>
                  <p className="mt-1 text-text">
                    {profile.platforms.length > 0 ? profile.platforms.join(' · ') : t('profile.about.noneSet')}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted">{t('profile.about.genres')}</h3>
                  <p className="mt-1 text-text">
                    {profile.genres.length > 0 ? profile.genres.join(' · ') : t('profile.about.noneSet')}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted">{t('profile.about.typicalPlayTimes')}</h3>
                  <p className="mt-1 text-text">
                    {profile.typicalPlayTimes.length > 0
                      ? profile.typicalPlayTimes
                          .map((time) => tOnboarding(`onboarding.playstyle.typicalPlayTimeOptions.${time}`))
                          .join(' · ')
                      : t('profile.about.noneSet')}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-surface p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-text">{t('profile.about.connectedAccounts')}</h2>
                {isOwner && (
                  <Link to="/settings" className="text-sm text-primary hover:underline">
                    {t('profile.about.manageConnections')}
                  </Link>
                )}
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-text">{t('profile.about.steam')}</span>
                <Badge variant={steamAccount ? 'completed' : 'tag'}>
                  {steamAccount ? t('profile.about.connected') : t('profile.about.notConnected')}
                </Badge>
              </div>
            </div>
          </div>
        )}
      </div>

      {isOwner && activeTab === 'posts' && (
        <button
          type="button"
          aria-label={t('profile.createPost')}
          onClick={() => openCreatePost('Profile')}
          className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-transform hover:scale-105 active:scale-95 md:hidden"
        >
          <Plus className="h-6 w-6" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}
