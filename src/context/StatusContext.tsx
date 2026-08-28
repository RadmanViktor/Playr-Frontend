import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { getProfile, updateProfileStatus, type PlayStyle, type ProfileStatus } from '../api/profilesApi'
import { useAuth } from './AuthContext'

export interface StatusContextValue {
  status: ProfileStatus
  avatarUrl: string | null
  lookingForGameId: string | null
  lookingForGameName: string | null
  lookingForPlayStyle: PlayStyle | null
  lookingForGameNote: string | null
  isLoading: boolean
  updateStatus: (
    status: ProfileStatus,
    lookingForGameId?: string | null,
    lookingForPlayStyle?: PlayStyle | null,
    lookingForGameNote?: string | null,
  ) => Promise<void>
}

const StatusContext = createContext<StatusContextValue | null>(null)

export function StatusProvider({ children }: { children: ReactNode }) {
  const { user, token } = useAuth()
  const [status, setStatus] = useState<ProfileStatus>('Online')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [lookingForGameId, setLookingForGameId] = useState<string | null>(null)
  const [lookingForGameName, setLookingForGameName] = useState<string | null>(null)
  const [lookingForPlayStyle, setLookingForPlayStyle] = useState<PlayStyle | null>(null)
  const [lookingForGameNote, setLookingForGameNote] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadStatus() {
      if (!user) {
        setStatus('Online')
        setAvatarUrl(null)
        setLookingForGameId(null)
        setLookingForGameName(null)
        setLookingForPlayStyle(null)
        setLookingForGameNote(null)
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        const profile = await getProfile(user.username)
        if (!cancelled) {
          setStatus(profile.status)
          setAvatarUrl(profile.avatarUrl)
          setLookingForGameId(profile.lookingForGameId)
          setLookingForGameName(profile.lookingForGameName)
          setLookingForPlayStyle(profile.lookingForPlayStyle)
          setLookingForGameNote(profile.lookingForGameNote)
        }
      } catch {
        // Keep defaults if the profile can't be loaded.
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    loadStatus()

    return () => {
      cancelled = true
    }
  }, [user])

  const updateStatus = useCallback(
    async (
      newStatus: ProfileStatus,
      newLookingForGameId?: string | null,
      newLookingForPlayStyle?: PlayStyle | null,
      newLookingForGameNote?: string | null,
    ) => {
      if (!token) {
        throw new Error('You must be logged in to update your status.')
      }

      const profile = await updateProfileStatus(token, {
        status: newStatus,
        lookingForGameId: newLookingForGameId ?? null,
        lookingForPlayStyle: newLookingForPlayStyle ?? null,
        lookingForGameNote: newLookingForGameNote ?? null,
      })

      setStatus(profile.status)
      setAvatarUrl(profile.avatarUrl)
      setLookingForGameId(profile.lookingForGameId)
      setLookingForGameName(profile.lookingForGameName)
      setLookingForPlayStyle(profile.lookingForPlayStyle)
      setLookingForGameNote(profile.lookingForGameNote)
    },
    [token],
  )

  return (
    <StatusContext.Provider
      value={{
        status,
        avatarUrl,
        lookingForGameId,
        lookingForGameName,
        lookingForPlayStyle,
        lookingForGameNote,
        isLoading,
        updateStatus,
      }}
    >
      {children}
    </StatusContext.Provider>
  )
}

export function useStatus(): StatusContextValue {
  const context = useContext(StatusContext)
  if (!context) {
    throw new Error('useStatus must be used within a StatusProvider')
  }
  return context
}
