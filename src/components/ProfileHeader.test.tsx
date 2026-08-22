import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProfileHeader } from './ProfileHeader'
import type { ProfileData } from '../api/profilesApi'

const profile: ProfileData = {
  userId: 'u1', username: 'nexusnova', displayName: 'NexusNova', bio: 'Gaming is life',
  avatarUrl: null, region: 'EU', languages: ['English', 'Swedish'],
  platforms: ['PC', 'PlayStation'], externalLinks: { Steam: 'https://steamcommunity.com/id/nexusnova' },
  currentlyPlayingGames: [], lookingForPlayers: false,
  createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
}

describe('ProfileHeader', () => {
  it('renders displayName and username', () => {
    render(<ProfileHeader profile={profile} isOwner={false} onEditClick={vi.fn()} />)
    expect(screen.getByText('NexusNova')).toBeInTheDocument()
    expect(screen.getByText('@nexusnova')).toBeInTheDocument()
  })

  it('renders bio', () => {
    render(<ProfileHeader profile={profile} isOwner={false} onEditClick={vi.fn()} />)
    expect(screen.getByText('Gaming is life')).toBeInTheDocument()
  })

  it('renders region', () => {
    render(<ProfileHeader profile={profile} isOwner={false} onEditClick={vi.fn()} />)
    expect(screen.getByText('EU')).toBeInTheDocument()
  })

  it('renders platform badges', () => {
    render(<ProfileHeader profile={profile} isOwner={false} onEditClick={vi.fn()} />)
    expect(screen.getByText('PC')).toBeInTheDocument()
    expect(screen.getByText('PlayStation')).toBeInTheDocument()
  })

  it('renders external links as anchors', () => {
    render(<ProfileHeader profile={profile} isOwner={false} onEditClick={vi.fn()} />)
    const link = screen.getByRole('link', { name: /steam/i })
    expect(link).toHaveAttribute('href', 'https://steamcommunity.com/id/nexusnova')
    expect(link).toHaveAttribute('target', '_blank')
  })

  it('shows Edit Profile button when isOwner', () => {
    render(<ProfileHeader profile={profile} isOwner={true} onEditClick={vi.fn()} />)
    expect(screen.getByRole('button', { name: /edit profile/i })).toBeInTheDocument()
  })

  it('hides Edit Profile button when not isOwner', () => {
    render(<ProfileHeader profile={profile} isOwner={false} onEditClick={vi.fn()} />)
    expect(screen.queryByRole('button', { name: /edit profile/i })).not.toBeInTheDocument()
  })

  it('calls onEditClick when Edit Profile is clicked', async () => {
    const onEditClick = vi.fn()
    const user = userEvent.setup()
    render(<ProfileHeader profile={profile} isOwner={true} onEditClick={onEditClick} />)
    await user.click(screen.getByRole('button', { name: /edit profile/i }))
    expect(onEditClick).toHaveBeenCalledOnce()
  })
})
