import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PostCard } from '../components/PostCard'
import { getPost, type PostFeedItem } from '../api/postsApi'
import { useAuth } from '../context/AuthContext'
import { ApiError } from '../api/http'

export default function PostDetailPage() {
  const { t } = useTranslation('pagesA')
  const { postId } = useParams<{ postId: string }>()
  const [searchParams] = useSearchParams()
  const commentId = searchParams.get('commentId') ?? undefined
  const { user, token } = useAuth()
  const [post, setPost] = useState<PostFeedItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!postId) return
    let cancelled = false
    setIsLoading(true)
    setError(null)
    getPost(postId, token)
      .then((result) => {
        if (!cancelled) setPost(result)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err instanceof ApiError && err.status === 404 ? t('postDetail.notFound') : t('postDetail.loadError'))
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [postId, token])

  if (isLoading) {
    return <p className="text-muted">{t('postDetail.loading')}</p>
  }

  if (error || !post) {
    return <p className="text-frustrated">{error ?? t('postDetail.notFound')}</p>
  }

  return (
    <div className="flex flex-col gap-4">
      <PostCard
        post={post}
        currentUserId={user?.id}
        onUpdate={setPost}
        defaultCommentsOpen
        highlightCommentId={commentId}
      />
    </div>
  )
}
