import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ProfileData } from '../api/profilesApi'
import * as onboardingApi from '../api/onboardingApi'
import * as profilesApi from '../api/profilesApi'
import OnboardingPage from './OnboardingPage'

vi.mock('../api/onboardingApi')
vi.mock('../api/profilesApi')

const refreshOnboardingStatus = vi.fn().mockResolvedValue(undefined)

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    token: 'token',
    user: { username: 'player' },
    refreshOnboardingStatus,
  }),
}))

const uploadedProfile = {
  coverImageUrl: '/uploads/cover.jpg',
  coverImagePositionX: 50,
  coverImagePositionY: 50,
} as ProfileData

beforeEach(() => {
  vi.resetAllMocks()
  refreshOnboardingStatus.mockResolvedValue(undefined)
  vi.mocked(profilesApi.uploadCoverImage).mockResolvedValue(uploadedProfile)
  vi.mocked(profilesApi.updateCoverImagePosition).mockResolvedValue(uploadedProfile)
  vi.mocked(onboardingApi.completeOnboarding).mockResolvedValue({ hasCompletedOnboarding: true })
})

describe('OnboardingPage', () => {
  it('uses the shared cover editor and persists its position', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <OnboardingPage />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: /get started/i }))
    for (let step = 0; step < 4; step += 1) {
      await user.click(screen.getByRole('button', { name: /continue/i }))
    }

    const coverFile = new File(['cover'], 'cover.jpg', { type: 'image/jpeg' })
    await user.upload(screen.getByLabelText(/upload cover image/i), coverFile)

    const dragSurface = screen.getByRole('button', { name: /change cover image/i }).parentElement!
    expect(dragSurface).toHaveClass('touch-none')
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

    await user.click(screen.getByRole('button', { name: /finish profile/i }))

    await waitFor(() => {
      expect(profilesApi.uploadCoverImage).toHaveBeenCalledWith('token', coverFile)
      expect(profilesApi.updateCoverImagePosition).toHaveBeenCalledWith('token', 40, 35)
      expect(onboardingApi.completeOnboarding).toHaveBeenCalledOnce()
    })
  })
})
