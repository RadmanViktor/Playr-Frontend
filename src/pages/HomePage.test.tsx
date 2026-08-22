import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import HomePage from './HomePage'

describe('HomePage', () => {
  it('renders the home heading and placeholder', () => {
    render(<HomePage />)
    expect(screen.getByRole('heading', { name: 'Home' })).toBeInTheDocument()
    expect(screen.getByText('Feed coming soon')).toBeInTheDocument()
  })
})
