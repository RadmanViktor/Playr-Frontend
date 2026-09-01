import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BadgeSection } from './BadgeSection'
import { BADGE_CATALOG } from '../constants/badgeCatalog'
import * as badgesApi from '../api/badgesApi'

vi.mock('../api/badgesApi', async () => {
  const actual = await vi.importActual<typeof import('../api/badgesApi')>('../api/badgesApi')
  return {
    ...actual,
    getMyBadges: vi.fn(),
    setActiveBadge: vi.fn(),
  }
})

describe('BadgeSection', () => {
  beforeEach(() => {
    vi.mocked(badgesApi.getMyBadges).mockReset()
    vi.mocked(badgesApi.setActiveBadge).mockReset()
  })

  it('renders unlocked badges', async () => {
    vi.mocked(badgesApi.getMyBadges).mockResolvedValueOnce({
      userId: 'u1',
      badges: [{ type: 'Poster', level: 'Bronze', unlockedAt: new Date().toISOString() }],
      activeBadgeType: null,
      activeBadgeLevel: null,
    })

    render(<BadgeSection token="tok" />)

    expect(await screen.findByText('Poster')).toBeInTheDocument()
  })

  it('shows a locked badge preview grid for badges the user has not unlocked', async () => {
    vi.mocked(badgesApi.getMyBadges).mockResolvedValueOnce({
      userId: 'u1',
      badges: [{ type: 'Poster', level: 'Bronze', unlockedAt: new Date().toISOString() }],
      activeBadgeType: null,
      activeBadgeLevel: null,
    })

    render(<BadgeSection token="tok" />)

    await waitFor(() => expect(screen.getByText('Upcoming badges')).toBeInTheDocument())

    // A representative sample of new + existing badge types should appear as locked previews.
    expect(screen.getByText('Night Owl')).toBeInTheDocument()
    expect(screen.getByText('Veteran')).toBeInTheDocument()
    expect(screen.getByText('Trailblazer')).toBeInTheDocument()
    expect(screen.getByText('Supporter')).toBeInTheDocument()
    expect(screen.getByText('Game Critic')).toBeInTheDocument()

    // Category hints are vague, not exact thresholds.
    expect(screen.queryByText(/\d+ posts/i)).not.toBeInTheDocument()
  })

  it('does not show a locked badge that has already been unlocked', async () => {
    vi.mocked(badgesApi.getMyBadges).mockResolvedValueOnce({
      userId: 'u1',
      badges: BADGE_CATALOG.map((entry) => ({ type: entry.type, level: 'Gold', unlockedAt: new Date().toISOString() })),
      activeBadgeType: null,
      activeBadgeLevel: null,
    })

    render(<BadgeSection token="tok" />)

    await waitFor(() => expect(screen.queryByText('Poster')).toBeInTheDocument())
    expect(screen.queryByText('Upcoming badges')).not.toBeInTheDocument()
  })
})
