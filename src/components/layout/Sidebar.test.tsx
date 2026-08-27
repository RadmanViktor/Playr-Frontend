import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Sidebar } from './Sidebar'

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '1', email: 'a@b.c', username: 'PlayerOne', displayName: null },
    logout: vi.fn(),
  }),
}))

vi.mock('../../context/StatusContext', () => ({
  useStatus: () => ({
    status: 'Online',
    lookingForGameId: null,
    lookingForGameName: null,
    lookingForPlayStyle: null,
    isLoading: false,
    updateStatus: vi.fn(),
  }),
}))

vi.mock('../../context/CreatePostModalContext', () => ({
  useCreatePostModal: () => ({
    openCreatePost: vi.fn(),
    closeCreatePost: vi.fn(),
    subscribePostCreated: vi.fn(() => vi.fn()),
  }),
}))

function renderSidebar() {
  return render(
    <MemoryRouter>
      <Sidebar />
    </MemoryRouter>,
  )
}

describe('Sidebar', () => {
  it('renders primary nav links', () => {
    renderSidebar()
    expect(screen.getByRole('link', { name: /home/i })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: /find players/i })).toHaveAttribute('href', '/find-players')
    expect(screen.getByRole('link', { name: /threads/i })).toHaveAttribute('href', '/threads')
  })

  it('shows the current username', () => {
    renderSidebar()
    expect(screen.getByText('PlayerOne')).toBeInTheDocument()
  })
})
