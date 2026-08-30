import { createContext, useCallback, useContext, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { CreatePostModal } from '../components/CreatePostModal'
import { Toast } from '../components/ui/Toast'
import type { PostFeedItem, PostScope } from '../api/postsApi'

interface CreatePostModalContextValue {
  openCreatePost: (scope?: PostScope) => void
  closeCreatePost: () => void
  subscribePostCreated: (callback: (post: PostFeedItem) => void) => () => void
}

const CreatePostModalContext = createContext<CreatePostModalContextValue | null>(null)

export function CreatePostModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [scope, setScope] = useState<PostScope>('Feed')
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const subscribersRef = useRef(new Set<(post: PostFeedItem) => void>())

  const openCreatePost = useCallback((nextScope: PostScope = 'Feed') => {
    setScope(nextScope)
    setIsOpen(true)
  }, [])
  const closeCreatePost = useCallback(() => setIsOpen(false), [])

  const subscribePostCreated = useCallback((callback: (post: PostFeedItem) => void) => {
    subscribersRef.current.add(callback)
    return () => subscribersRef.current.delete(callback)
  }, [])

  const handlePostCreated = useCallback((post: PostFeedItem) => {
    setIsOpen(false)
    setToastMessage('Post published!')
    subscribersRef.current.forEach((callback) => callback(post))
  }, [])

  return (
    <CreatePostModalContext.Provider value={{ openCreatePost, closeCreatePost, subscribePostCreated }}>
      {children}
      {isOpen && <CreatePostModal scope={scope} onClose={closeCreatePost} onPostCreated={handlePostCreated} />}
      {toastMessage && <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />}
    </CreatePostModalContext.Provider>
  )
}

export function useCreatePostModal(): CreatePostModalContextValue {
  const context = useContext(CreatePostModalContext)
  if (!context) {
    throw new Error('useCreatePostModal must be used within a CreatePostModalProvider')
  }
  return context
}
