import { API_BASE_URL, ApiError, parseErrorMessage } from './http'

export interface Game {
  id: string
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
