import { API_BASE_URL, ApiError, parseErrorMessage } from './http'

export interface Game {
  id: string
  name: string
  coverImageUrl: string | null
  genre: string | null
}

export interface ExternalGameSearchResult {
  rawgId: number
  name: string
  coverImageUrl: string | null
  genre: string | null
}

export async function getGames(): Promise<Game[]> {
  const response = await fetch(`${API_BASE_URL}/api/games`)
  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Failed to load games.')
    throw new ApiError(response.status, message)
  }
  return response.json()
}

export async function searchExternalGames(
  token: string,
  query: string,
  signal?: AbortSignal,
): Promise<ExternalGameSearchResult[]> {
  const response = await fetch(`${API_BASE_URL}/api/games/search-external?query=${encodeURIComponent(query)}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  })
  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Failed to search games.')
    throw new ApiError(response.status, message)
  }
  return response.json()
}

export async function createGame(token: string, game: ExternalGameSearchResult): Promise<Game> {
  const response = await fetch(`${API_BASE_URL}/api/games`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      rawgId: game.rawgId,
      name: game.name,
      coverImageUrl: game.coverImageUrl,
      genre: game.genre,
    }),
  })
  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Failed to add game.')
    throw new ApiError(response.status, message)
  }
  return response.json()
}
