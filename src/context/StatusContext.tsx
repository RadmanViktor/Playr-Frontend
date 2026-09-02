import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { getProfile, updateProfileStatus, type PlayStyle, type ProfileData, type ProfileStatus } from '../api/profilesApi'
import { useAuth } from './AuthContext'
import { useIdleTimer } from '../lib/useIdleTimer'
import { onUserStatusChanged } from '../lib/chatHubConnection'

const IDLE_TIMEOUT_MS = 5 * 60 * 1000

export interface StatusContextValue {
  status: ProfileStatus
  avatarUrl: string | null
  lookingForGameId: string | null
  lookingForGameName: string | null
  lookingForPlayStyle: PlayStyle | null
  lookingForGameNote: string | null
  lookingForPreferredMinAge: number | null
  lookingForPreferredMaxAge: number | null
  lookingForVoiceChatEnabled: boolean
  isLoading: boolean
  updateStatus: (
    status: ProfileStatus,
    lookingForGameId?: string | null,
    lookingForPlayStyle?: PlayStyle | null,
    lookingForGameNote?: string | null,
    lookingForPreferredMinAge?: number | null,
    lookingForPreferredMaxAge?: number | null,
    lookingForVoiceChatEnabled?: boolean,
  ) => Promise<void>
  setProfileSnapshot: (profile: ProfileData) => void
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
  const [lookingForPreferredMinAge, setLookingForPreferredMinAge] = useState<number | null>(null)
  const [lookingForPreferredMaxAge, setLookingForPreferredMaxAge] = useState<number | null>(null)
  const [lookingForVoiceChatEnabled, setLookingForVoiceChatEnabled] = useState(false)
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
        setLookingForPreferredMinAge(null)
        setLookingForPreferredMaxAge(null)
        setLookingForVoiceChatEnabled(false)
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
          setLookingForPreferredMinAge(profile.lookingForPreferredMinAge)
          setLookingForPreferredMaxAge(profile.lookingForPreferredMaxAge)
          setLookingForVoiceChatEnabled(profile.lookingForVoiceChatEnabled)
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
      newLookingForPreferredMinAge?: number | null,
      newLookingForPreferredMaxAge?: number | null,
      newLookingForVoiceChatEnabled?: boolean,
    ) => {
      if (!token) {
        throw new Error('You must be logged in to update your status.')
      }

      const profile = await updateProfileStatus(token, {
        status: newStatus,
        lookingForGameId: newLookingForGameId ?? null,
        lookingForPlayStyle: newLookingForPlayStyle ?? null,
        lookingForGameNote: newLookingForGameNote ?? null,
        lookingForPreferredMinAge: newLookingForPreferredMinAge ?? null,
        lookingForPreferredMaxAge: newLookingForPreferredMaxAge ?? null,
        lookingForVoiceChatEnabled: newLookingForVoiceChatEnabled ?? false,
      })

      setStatus(profile.status)
      setAvatarUrl(profile.avatarUrl)
      setLookingForGameId(profile.lookingForGameId)
      setLookingForGameName(profile.lookingForGameName)
      setLookingForPlayStyle(profile.lookingForPlayStyle)
      setLookingForGameNote(profile.lookingForGameNote)
      setLookingForPreferredMinAge(profile.lookingForPreferredMinAge)
      setLookingForPreferredMaxAge(profile.lookingForPreferredMaxAge)
      setLookingForVoiceChatEnabled(profile.lookingForVoiceChatEnabled)
    },
    [token],
  )

  const setProfileSnapshot = useCallback((profile: ProfileData) => {
    setStatus(profile.status)
    setAvatarUrl(profile.avatarUrl)
    setLookingForGameId(profile.lookingForGameId)
    setLookingForGameName(profile.lookingForGameName)
    setLookingForPlayStyle(profile.lookingForPlayStyle)
    setLookingForGameNote(profile.lookingForGameNote)
    setLookingForPreferredMinAge(profile.lookingForPreferredMinAge)
    setLookingForPreferredMaxAge(profile.lookingForPreferredMaxAge)
    setLookingForVoiceChatEnabled(profile.lookingForVoiceChatEnabled)
  }, [])

  // Reflect status changes pushed by the server (e.g. an invitation/application/group
  // invite being accepted resets a "Looking for game" status back to Online) so the
  // current tab updates live instead of requiring a reload.
  useEffect(() => {
    if (!user) return
    return onUserStatusChanged((event) => {
      if (event.userId !== user.id) return
      setStatus(event.status)
      if (event.status !== 'LookingForGame') {
        setLookingForGameId(null)
        setLookingForGameName(null)
        setLookingForPlayStyle(null)
        setLookingForGameNote(null)
        setLookingForPreferredMinAge(null)
        setLookingForPreferredMaxAge(null)
        setLookingForVoiceChatEnabled(false)
      }
    })
  }, [user])

  // Keeps the idle-timer callbacks below reading the latest status without
  // needing to be re-subscribed (and thus reset) every time it changes.
  const statusRef = useRef(status)
  statusRef.current = status

  useIdleTimer({
    timeoutMs: IDLE_TIMEOUT_MS,
    enabled: !!user,
    onIdle: useCallback(() => {
      // Only auto-manage the plain "Online" status - a manually chosen
      // Busy/LookingForGame/Offline status is left alone.
      if (statusRef.current === 'Online') {
        updateStatus('Inactive', null, null, null).catch(() => {
          // Best-effort; a failed heartbeat update isn't worth surfacing to the user.
        })
      }
    }, [updateStatus]),
    onActive: useCallback(() => {
      if (statusRef.current === 'Inactive') {
        updateStatus('Online', null, null, null).catch(() => {
          // Best-effort; a failed heartbeat update isn't worth surfacing to the user.
        })
      }
    }, [updateStatus]),
  })

  return (
    <StatusContext.Provider
      value={{
        status,
        avatarUrl,
        lookingForGameId,
        lookingForGameName,
        lookingForPlayStyle,
        lookingForGameNote,
        lookingForPreferredMinAge,
        lookingForPreferredMaxAge,
        lookingForVoiceChatEnabled,
        isLoading,
        updateStatus,
        setProfileSnapshot,
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
