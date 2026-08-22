export const API_BASE_URL = 'http://localhost:5258'

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function parseErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const body = await response.json()
    if (body && typeof body.error === 'string') return body.error
    if (body && body.errors && typeof body.errors === 'object') {
      const messages = Object.values(body.errors as Record<string, unknown>)
        .flat()
        .filter((m): m is string => typeof m === 'string')
      if (messages.length > 0) return messages.join(' ')
    }
  } catch { /* ignore */ }
  return fallback
}
