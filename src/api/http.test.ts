import { describe, it, expect } from 'vitest'
import { resolveMediaUrl, API_BASE_URL } from './http'

describe('resolveMediaUrl', () => {
  it('prefixes server-relative paths with the API origin', () => {
    expect(resolveMediaUrl('/uploads/a.png')).toBe(`${API_BASE_URL}/uploads/a.png`)
  })

  it('handles paths missing a leading slash', () => {
    expect(resolveMediaUrl('uploads/a.png')).toBe(`${API_BASE_URL}/uploads/a.png`)
  })

  it('passes absolute http(s) URLs through untouched', () => {
    const steam = 'https://avatars.steamstatic.com/abc.jpg'
    expect(resolveMediaUrl(steam)).toBe(steam)
    expect(resolveMediaUrl('http://example.com/a.png')).toBe('http://example.com/a.png')
  })

  it('passes blob: previews through untouched', () => {
    // AvatarUploadInput and MediaGalleryUploadInput render object URLs for
    // files the user just picked; prefixing these breaks the preview.
    const blob = 'blob:http://localhost:5173/9f0e-1234'
    expect(resolveMediaUrl(blob)).toBe(blob)
  })

  it('passes data: URIs through untouched', () => {
    const data = 'data:image/png;base64,iVBORw0KGgo='
    expect(resolveMediaUrl(data)).toBe(data)
  })

  it('passes protocol-relative URLs through untouched', () => {
    expect(resolveMediaUrl('//cdn.example.com/a.png')).toBe('//cdn.example.com/a.png')
  })

  it('returns null for empty input', () => {
    expect(resolveMediaUrl(null)).toBeNull()
    expect(resolveMediaUrl(undefined)).toBeNull()
    expect(resolveMediaUrl('')).toBeNull()
  })
})
