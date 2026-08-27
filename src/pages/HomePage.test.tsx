import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import HomePage from './HomePage'

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: null, token: null }),
}))

vi.mock('../context/CreatePostModalContext', () => ({
  useCreatePostModal: () => ({
    openCreatePost: vi.fn(),
    closeCreatePost: vi.fn(),
    subscribePostCreated: vi.fn(() => vi.fn()),
  }),
}))

describe('HomePage', () => {
  it('renders the home heading and placeholder', () => {
    render(<HomePage />)
    expect(screen.getByRole('heading', { name: 'Home' })).toBeInTheDocument()
    expect(screen.getByText('Feed coming soon')).toBeInTheDocument()
  })
})
