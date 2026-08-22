import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Avatar } from './Avatar'

describe('Avatar', () => {
  it('renders an image with alt text', () => {
    render(<Avatar src="/a.png" alt="PlayerOne" />)
    expect(screen.getByRole('img', { name: 'PlayerOne' })).toHaveAttribute('src', '/a.png')
  })

  it('renders a fallback initial when no src', () => {
    render(<Avatar alt="Zoe" />)
    expect(screen.getByText('Z')).toBeInTheDocument()
  })

  it('renders a status dot when status is provided', () => {
    render(<Avatar alt="Zoe" status="online" />)
    expect(screen.getByTestId('avatar-status')).toHaveAttribute('data-status', 'online')
  })
})
