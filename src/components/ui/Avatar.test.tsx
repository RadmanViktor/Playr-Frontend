import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Avatar } from './Avatar'
import { API_BASE_URL } from '../../api/http'

describe('Avatar', () => {
  it('resolves server-relative avatar paths', () => {
    render(<Avatar src="/uploads/avatars/me.png" alt="Ada" />)

    expect(screen.getByAltText('Ada')).toHaveAttribute(
      'src',
      `${API_BASE_URL}/uploads/avatars/me.png`,
    )
  })

  it('leaves blob previews untouched', () => {
    render(<Avatar src="blob:http://localhost/abc" alt="Ada" />)

    expect(screen.getByAltText('Ada')).toHaveAttribute('src', 'blob:http://localhost/abc')
  })

  it('falls back to the initial when there is no avatar', () => {
    render(<Avatar alt="Ada" />)

    expect(screen.queryByAltText('Ada')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Ada')).toHaveTextContent('A')
  })

  it('falls back to the initial when the image fails to load', () => {
    render(<Avatar src="/uploads/missing.png" alt="Ada" />)

    fireEvent.error(screen.getByAltText('Ada'))

    // A broken <img> otherwise paints its alt text at intrinsic size and
    // blows the avatar out of its box.
    expect(screen.queryByAltText('Ada')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Ada')).toHaveTextContent('A')
  })

  it('retries when the src changes after a failure', () => {
    const { rerender } = render(<Avatar src="/uploads/missing.png" alt="Ada" />)
    fireEvent.error(screen.getByAltText('Ada'))
    expect(screen.queryByAltText('Ada')).not.toBeInTheDocument()

    rerender(<Avatar src="/uploads/new.png" alt="Ada" />)

    expect(screen.getByAltText('Ada')).toHaveAttribute('src', `${API_BASE_URL}/uploads/new.png`)
  })

  it('keeps the status dot clipped inside the avatar box', () => {
    render(<Avatar src="/uploads/a.png" alt="Ada" status="online" />)

    expect(screen.getByTestId('avatar-status').parentElement!.className).toContain('overflow-hidden')
  })

  it('renders no badge ring when there is no active badge', () => {
    render(<Avatar alt="Ada" />)

    expect(screen.queryByTestId('avatar-badge-ring')).not.toBeInTheDocument()
  })

  it('renders the animated neon ring for the Creator badge regardless of level', () => {
    render(<Avatar alt="Ada" badgeType="Creator" badgeLevel={null} />)

    const ring = screen.getByTestId('avatar-badge-ring')
    expect(ring.className).toContain('badge-ring-creator')
    expect(ring).toHaveAttribute('title', 'Creator')
  })

  it('renders a plain tiered ring for stat-based badges', () => {
    render(<Avatar alt="Ada" badgeType="Poster" badgeLevel="Gold" />)

    const ring = screen.getByTestId('avatar-badge-ring')
    expect(ring.className).toContain('badge-ring-gold')
    expect(ring).not.toHaveClass('badge-ring-creator')
  })

  it('renders the animated gold/white glitter ring for the FirstHundredUsers badge', () => {
    render(<Avatar alt="Ada" badgeType="FirstHundredUsers" badgeLevel="Gold" />)

    const ring = screen.getByTestId('avatar-badge-ring')
    expect(ring.className).toContain('badge-ring-founder')
    expect(ring).not.toHaveClass('badge-ring-gold')
  })

  it('renders the animated void ring for the Voidtouched badge', () => {
    render(<Avatar alt="Ada" badgeType="Voidtouched" badgeLevel="Gold" />)

    const ring = screen.getByTestId('avatar-badge-ring')
    expect(ring.className).toContain('badge-ring-voidtouched')
    expect(ring).not.toHaveClass('badge-ring-gold')
  })
})
