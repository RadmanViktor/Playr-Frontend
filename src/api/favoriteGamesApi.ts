import { API_BASE_URL, ApiError, parseErrorMessage } from './http'

export interface FavoriteGameEntry {
  gameId: string
  gameName: string
  gameCoverImageUrl: string | null
  genre: string | null
  createdAt: string
}

export async function getFavoriteGames(username: string): Promise<FavoriteGameEntry[]> {
  const response = await fetch(`${API_BASE_URL}/api/profiles/${encodeURIComponent(username)}/favorites`)
  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Failed to load favorite games.')
    throw new ApiError(response.status, message)
  }
  return response.json()
}

export async function addFavoriteGame(token: string, gameId: string): Promise<FavoriteGameEntry> {
  const response = await fetch(`${API_BASE_URL}/api/profiles/me/favorites`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ gameId }),
  })
  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Failed to add favorite game.')
    throw new ApiError(response.status, message)
  }
  return response.json()
}

export async function removeFavoriteGame(token: string, gameId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/profiles/me/favorites/${gameId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Failed to remove favorite game.')
    throw new ApiError(response.status, message)
  }
}
