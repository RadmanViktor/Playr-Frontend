import { API_BASE_URL, ApiError, parseErrorMessage } from './http'

export interface GameLibraryEntry {
  gameId: string
  gameName: string
  gameCoverImageUrl: string | null
  genre: string | null
  rating: number | null
  reviewText: string | null
  addedAt: string
  updatedAt: string
}

export async function getGameLibrary(username: string): Promise<GameLibraryEntry[]> {
  const response = await fetch(`${API_BASE_URL}/api/profiles/${encodeURIComponent(username)}/library`)
  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Failed to load game library.')
    throw new ApiError(response.status, message)
  }
  return response.json()
}

export async function addGameToLibrary(token: string, gameId: string): Promise<GameLibraryEntry> {
  const response = await fetch(`${API_BASE_URL}/api/profiles/me/library`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ gameId }),
  })
  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Failed to add game to library.')
    throw new ApiError(response.status, message)
  }
  return response.json()
}

export async function rateGame(
  token: string,
  gameId: string,
  rating: number,
  reviewText: string | null,
): Promise<GameLibraryEntry> {
  const response = await fetch(`${API_BASE_URL}/api/profiles/me/library/${gameId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ rating, reviewText }),
  })
  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Failed to save rating.')
    throw new ApiError(response.status, message)
  }
  return response.json()
}

export async function removeGameFromLibrary(token: string, gameId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/profiles/me/library/${gameId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Failed to remove game from library.')
    throw new ApiError(response.status, message)
  }
}
