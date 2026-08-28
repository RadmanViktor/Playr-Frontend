export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5258'

/**
 * Turns a server-relative media path into a fully qualified URL.
 *
 * Must pass through anything that is already addressable on its own:
 * - `blob:` / `data:` — local previews of files the user just picked
 * - `http:` / `https:` — externally hosted images (e.g. Steam avatars)
 * - `//host/path` — protocol-relative
 *
 * Prefixing any of those with the API origin produces a broken URL.
 */
export function resolveMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null
  if (/^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith('//')) return url
  return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`
}

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
