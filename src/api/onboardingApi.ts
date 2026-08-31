import { API_BASE_URL, ApiError, parseErrorMessage } from './http'

export type PlaystylePreference = 'Casual' | 'Competitive' | 'Both'
export type UsuallyPlayingWith = 'Solo' | 'WithFriends' | 'LookingForPlayers'
export type TypicalPlayTime = 'Evenings' | 'Weekends' | 'Daytime' | 'Varies'

export interface OnboardingStatus {
  hasCompletedOnboarding: boolean
}

export interface PlayingNowItemInput {
  gameId: string
  statusText?: string | null
}

export interface CompleteOnboardingData {
  platforms: string[]
  genres: string[]
  gameIds: string[]
  playingNow: PlayingNowItemInput[]
  playstylePreference?: PlaystylePreference | null
  usuallyPlayingWith?: UsuallyPlayingWith | null
  typicalPlayTimes: TypicalPlayTime[]
  bio?: string | null
}

export async function getOnboardingStatus(token: string): Promise<OnboardingStatus> {
  const response = await fetch(`${API_BASE_URL}/api/onboarding/status`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Failed to load onboarding status.')
    throw new ApiError(response.status, message)
  }
  return response.json()
}

export async function completeOnboarding(token: string, data: CompleteOnboardingData): Promise<OnboardingStatus> {
  const response = await fetch(`${API_BASE_URL}/api/onboarding/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Failed to complete onboarding.')
    throw new ApiError(response.status, message)
  }
  return response.json()
}
