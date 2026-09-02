import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { LoginLiveLobby } from './LoginLiveLobby'
import { getPublicLookingForGameSummary } from '../api/publicLobbyApi'

vi.mock('../api/publicLobbyApi', async (importOriginal) => {
  const original = await importOriginal<typeof import('../api/publicLobbyApi')>()
  return { ...original, getPublicLookingForGameSummary: vi.fn() }
})

const summary = {
  totalCount: 12,
  featuredGame: {
    name: 'Valorant',
    coverImageUrl: '/uploads/valorant.jpg',
    playerCount: 5,
  },
  players: [
    {
      username: 'novahex',
      displayName: 'NovaHex',
      avatarUrl: '/uploads/nova.jpg',
      gameName: 'Valorant',
      playStyle: 'Competitive' as const,
    },
    {
      username: 'elias',
      displayName: 'Elias',
      avatarUrl: null,
      gameName: 'Elden Ring',
      playStyle: 'Chill' as const,
    },
  ],
}

function renderLobby() {
  return render(<MemoryRouter><LoginLiveLobby /></MemoryRouter>)
}

describe('LoginLiveLobby', () => {
  beforeEach(() => vi.mocked(getPublicLookingForGameSummary).mockReset())
  afterEach(() => vi.clearAllTimers())

  it('shows real players and links to their public profiles', async () => {
    vi.mocked(getPublicLookingForGameSummary).mockResolvedValue(summary)
    renderLobby()

    expect(await screen.findAllByText('Valorant')).toHaveLength(2)
    expect(screen.getByRole('link', { name: 'NovaHex' })).toHaveAttribute(
      'href',
      '/profile/novahex',
    )
    expect(screen.getByText('12 players looking')).toBeInTheDocument()
    expect(screen.getByTestId('live-lobby-cover')).toHaveAttribute(
      'src',
      'http://localhost:5258/uploads/valorant.jpg',
    )
  })

  it('shows an honest empty state', async () => {
    vi.mocked(getPublicLookingForGameSummary).mockResolvedValue({
      totalCount: 0,
      featuredGame: null,
      players: [],
    })
    renderLobby()

    expect(await screen.findByText(/lobby is quiet right now/i)).toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('keeps a neutral fallback when the lobby is unavailable', async () => {
    vi.mocked(getPublicLookingForGameSummary).mockRejectedValueOnce(new Error('offline'))
    renderLobby()

    expect(await screen.findByText(/find your next squad/i)).toBeInTheDocument()
    expect(screen.queryByText(/players looking/i)).not.toBeInTheDocument()
  })
})
