import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EditProfileForm } from './EditProfileForm'
import type { ProfileData } from '../api/profilesApi'
import * as profilesApi from '../api/profilesApi'

vi.mock('../api/profilesApi')

const profile: ProfileData = {
  userId: 'u1', username: 'player', displayName: 'Player One', bio: 'Hello',
  avatarUrl: null, coverImageUrl: null, coverImagePositionX: 50, coverImagePositionY: 50, region: 'EU', discordUsername: 'player.name', languages: ['English'], platforms: ['PC'],
  genres: [], externalLinks: { Steam: 'https://steam.com' },
  status: 'Online' as const, lookingForGameId: null, lookingForGameName: null, lookingForPlayStyle: null, lookingForGameNote: null,
  lookingForPreferredMinAge: null, lookingForPreferredMaxAge: null, lookingForVoiceChatEnabled: false,
  typicalPlayTimes: [], hasCompletedOnboarding: true,
  createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  relationshipStatus: null, pendingInvitationId: null, activeBadgeType: null, activeBadgeLevel: null,
}

const updated: ProfileData = { ...profile, displayName: 'Updated Name' }

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(profilesApi.updateProfile).mockResolvedValue(updated)
})

describe('EditProfileForm', () => {
  it('pre-fills displayName field', () => {
    render(<EditProfileForm profile={profile} token="tok" onSave={vi.fn()} onCancel={vi.fn()} />)
    expect(screen.getByDisplayValue('Player One')).toBeInTheDocument()
  })

  it('toggles PC platform off when clicked', async () => {
    const user = userEvent.setup()
    render(<EditProfileForm profile={profile} token="tok" onSave={vi.fn()} onCancel={vi.fn()} />)
    const pcButton = screen.getByRole('button', { name: 'PC' })
    expect(pcButton).toHaveAttribute('aria-pressed', 'true')
    await user.click(pcButton)
    expect(pcButton).toHaveAttribute('aria-pressed', 'false')
  })

  it('calls updateProfile and onSave on submit', async () => {
    const onSave = vi.fn()
    const user = userEvent.setup()
    render(<EditProfileForm profile={profile} token="tok" onSave={onSave} onCancel={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: /save/i }))
    await waitFor(() => expect(onSave).toHaveBeenCalledWith(updated))
    expect(profilesApi.updateProfile).toHaveBeenCalledWith('tok', expect.objectContaining({ displayName: 'Player One' }))
  })

  it('submits a trimmed Discord username', async () => {
    const user = userEvent.setup()
    render(<EditProfileForm profile={profile} token="tok" onSave={vi.fn()} onCancel={vi.fn()} />)
    const input = screen.getByRole('textbox', { name: /discord username/i })
    await user.clear(input)
    await user.type(input, '  new.player  ')
    await user.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() =>
      expect(profilesApi.updateProfile).toHaveBeenCalledWith(
        'tok',
        expect.objectContaining({ discordUsername: 'new.player' }),
      ),
    )
  })

  it('persists a repositioned newly uploaded cover image', async () => {
    const uploaded = { ...profile, coverImageUrl: '/uploads/cover.jpg' }
    vi.mocked(profilesApi.uploadCoverImage).mockResolvedValue(uploaded)
    vi.mocked(profilesApi.updateCoverImagePosition).mockResolvedValue({
      ...uploaded,
      coverImagePositionX: 40,
      coverImagePositionY: 35,
    })
    const user = userEvent.setup()
    render(<EditProfileForm profile={profile} token="tok" onSave={vi.fn()} onCancel={vi.fn()} />)

    const coverFile = new File(['cover'], 'cover.jpg', { type: 'image/jpeg' })
    await user.upload(screen.getByLabelText(/upload cover image/i), coverFile)

    const dragSurface = screen.getByRole('button', { name: /change cover image/i }).parentElement!
    dragSurface.setPointerCapture = vi.fn()
    dragSurface.releasePointerCapture = vi.fn()
    vi.spyOn(dragSurface, 'getBoundingClientRect').mockReturnValue({
      width: 200,
      height: 200,
      top: 0,
      right: 200,
      bottom: 200,
      left: 0,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })
    fireEvent.pointerDown(dragSurface, { pointerId: 1, clientX: 100, clientY: 100 })
    fireEvent.pointerMove(dragSurface, { pointerId: 1, clientX: 120, clientY: 130 })

    await user.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(profilesApi.uploadCoverImage).toHaveBeenCalledWith('tok', coverFile)
      expect(profilesApi.updateCoverImagePosition).toHaveBeenCalledWith('tok', 40, 35)
    })
  })

  it('selects and submits typical play times', async () => {
    const user = userEvent.setup()
    render(<EditProfileForm profile={profile} token="tok" onSave={vi.fn()} onCancel={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: 'Evenings' }))
    await user.click(screen.getByRole('button', { name: /save/i }))
    await waitFor(() =>
      expect(profilesApi.updateProfile).toHaveBeenCalledWith(
        'tok',
        expect.objectContaining({
          typicalPlayTimes: ['Evenings'],
        }),
      ),
    )
  })

  it('calls onCancel when Cancel is clicked', async () => {
    const onCancel = vi.fn()
    const user = userEvent.setup()
    render(<EditProfileForm profile={profile} token="tok" onSave={vi.fn()} onCancel={onCancel} />)
    await user.click(screen.getByRole('button', { name: /cancel/i }))
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('shows error message on updateProfile failure', async () => {
    const { ApiError } = await import('../api/http')
    vi.mocked(profilesApi.updateProfile).mockRejectedValueOnce(new ApiError(400, 'Display name is required.'))
    const user = userEvent.setup()
    render(<EditProfileForm profile={profile} token="tok" onSave={vi.fn()} onCancel={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: /save/i }))
    await waitFor(() => expect(screen.getByText('Display name is required.')).toBeInTheDocument())
  })
})
