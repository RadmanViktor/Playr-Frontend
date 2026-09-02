import { API_BASE_URL, ApiError, parseErrorMessage } from './http'

export type PublicLobbyPlayStyle = 'Competitive' | 'Chill'

export interface PublicLookingForGameFeaturedGame {
  name: string
  coverImageUrl: string | null
  playerCount: number
}

export interface PublicLookingForGamePlayer {
  username: string
  displayName: string
  avatarUrl: string | null
  gameName: string
  playStyle: PublicLobbyPlayStyle
}

export interface PublicLookingForGameSummary {
  totalCount: number
  featuredGame: PublicLookingForGameFeaturedGame | null
  players: PublicLookingForGamePlayer[]
}

export async function getPublicLookingForGameSummary(): Promise<PublicLookingForGameSummary> {
  const response = await fetch(`${API_BASE_URL}/api/profiles/looking-for-game/public`)
  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Failed to load the live lobby.')
    throw new ApiError(response.status, message)
  }
  return response.json()
}
