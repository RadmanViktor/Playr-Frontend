import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { StatusProvider, useStatus } from './StatusContext'
import type { ProfileData } from '../api/profilesApi'

const { mockUser } = vi.hoisted(() => ({ mockUser: { id: 'me', username: 'player' } }))

vi.mock('./AuthContext', () => ({
  useAuth: () => ({ user: mockUser, token: 'token' }),
}))

function profile(overrides: Partial<ProfileData> = {}): ProfileData {
  return {
    userId: 'me',
    username: 'player',
    displayName: 'Player',
    bio: null,
    avatarUrl: null,
    coverImageUrl: null,
    region: null,
    languages: [],
    platforms: [],
    genres: [],
    externalLinks: {},
    status: 'Online',
    lookingForGameId: null,
    lookingForGameName: null,
    lookingForPlayStyle: null,
    lookingForGameNote: null,
    typicalPlayTimes: [],
    hasCompletedOnboarding: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    relationshipStatus: null,
    pendingInvitationId: null,
    activeBadgeType: null,
    activeBadgeLevel: null,
    ...overrides,
  }
}

const getProfile = vi.fn()
const updateProfileStatus = vi.fn()

vi.mock('../api/profilesApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/profilesApi')>()
  return {
    ...actual,
    getProfile: (...args: unknown[]) => getProfile(...args),
    updateProfileStatus: (...args: unknown[]) => updateProfileStatus(...args),
  }
})

// StatusContext delegates all idle/active timing decisions to useIdleTimer
// (tested on its own in useIdleTimer.test.ts). Here we mock it and drive its
// onIdle/onActive callbacks directly, so this test only verifies how
// StatusContext reacts to those transitions.
let capturedOnIdle: (() => void) | null = null
let capturedOnActive: (() => void) | null = null

vi.mock('../lib/useIdleTimer', () => ({
  useIdleTimer: ({ onIdle, onActive }: { onIdle: () => void; onActive: () => void }) => {
    capturedOnIdle = onIdle
    capturedOnActive = onActive
  },
}))

function StatusDisplay() {
  const { status } = useStatus()
  return <div data-testid="status">{status}</div>
}

function renderProvider() {
  return render(
    <StatusProvider>
      <StatusDisplay />
    </StatusProvider>,
  )
}

beforeEach(() => {
  getProfile.mockResolvedValue(profile())
  capturedOnIdle = null
  capturedOnActive = null
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('StatusContext idle detection', () => {
  it('switches to Inactive when the idle timer reports idle while Online', async () => {
    updateProfileStatus.mockResolvedValue(profile({ status: 'Inactive' }))
    renderProvider()
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('Online'))

    await act(async () => {
      capturedOnIdle?.()
    })

    await waitFor(() =>
      expect(updateProfileStatus).toHaveBeenCalledWith('token', {
        status: 'Inactive',
        lookingForGameId: null,
        lookingForPlayStyle: null,
        lookingForGameNote: null,
      }),
    )
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('Inactive'))
  })

  it('switches back to Online when the idle timer reports activity while Inactive', async () => {
    updateProfileStatus.mockResolvedValueOnce(profile({ status: 'Inactive' }))
    updateProfileStatus.mockResolvedValueOnce(profile({ status: 'Online' }))
    renderProvider()
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('Online'))

    await act(async () => {
      capturedOnIdle?.()
    })
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('Inactive'))

    await act(async () => {
      capturedOnActive?.()
    })

    await waitFor(() =>
      expect(updateProfileStatus).toHaveBeenCalledWith('token', {
        status: 'Online',
        lookingForGameId: null,
        lookingForPlayStyle: null,
        lookingForGameNote: null,
      }),
    )
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('Online'))
  })

  it('does not auto-switch a manually set Busy status to Inactive', async () => {
    getProfile.mockResolvedValue(profile({ status: 'Busy' }))
    renderProvider()
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('Busy'))

    await act(async () => {
      capturedOnIdle?.()
    })

    expect(updateProfileStatus).not.toHaveBeenCalled()
    expect(screen.getByTestId('status')).toHaveTextContent('Busy')
  })

  it('does not switch to Online when activity resumes while status is not Inactive', async () => {
    getProfile.mockResolvedValue(profile({ status: 'Busy' }))
    renderProvider()
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('Busy'))

    await act(async () => {
      capturedOnActive?.()
    })

    expect(updateProfileStatus).not.toHaveBeenCalled()
    expect(screen.getByTestId('status')).toHaveTextContent('Busy')
  })
})
