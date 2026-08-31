import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProfileHeader } from './ProfileHeader'
import type { ProfileData } from '../api/profilesApi'

const profile: ProfileData = {
  userId: 'u1', username: 'nexusnova', displayName: 'Nexus Nova', bio: 'Gaming is life',
  avatarUrl: null, coverImageUrl: null, region: 'EU', languages: ['English', 'Swedish'],
  platforms: ['PC', 'PlayStation'], genres: [], externalLinks: { Steam: 'https://steamcommunity.com/id/nexusnova' },
  status: 'Online' as const, lookingForGameId: null, lookingForGameName: null, lookingForPlayStyle: null, lookingForGameNote: null,
  typicalPlayTimes: [], hasCompletedOnboarding: true,
  createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  relationshipStatus: null, pendingInvitationId: null,
}

describe('ProfileHeader', () => {
  it('renders displayName and username', () => {
    render(<ProfileHeader profile={profile} isOwner={false} />)
    expect(screen.getByText('Nexus Nova')).toBeInTheDocument()
    expect(screen.getByText('@nexusnova')).toBeInTheDocument()
  })

  it('renders bio', () => {
    render(<ProfileHeader profile={profile} isOwner={false} />)
    expect(screen.getByText('Gaming is life')).toBeInTheDocument()
  })

  it('renders region', () => {
    render(<ProfileHeader profile={profile} isOwner={false} />)
    expect(screen.getByText('EU')).toBeInTheDocument()
  })

  it('renders platform badges', () => {
    render(<ProfileHeader profile={profile} isOwner={false} />)
    expect(screen.getByText('PC')).toBeInTheDocument()
    expect(screen.getByText('PlayStation')).toBeInTheDocument()
  })

  it('renders genre badges', () => {
    render(<ProfileHeader profile={{ ...profile, genres: ['FPS', 'RPG'] }} isOwner={false} />)
    expect(screen.getByText('FPS')).toBeInTheDocument()
    expect(screen.getByText('RPG')).toBeInTheDocument()
  })

  it('renders external links as anchors', () => {
    render(<ProfileHeader profile={profile} isOwner={false} />)
    const link = screen.getByRole('link', { name: /steam/i })
    expect(link).toHaveAttribute('href', 'https://steamcommunity.com/id/nexusnova')
    expect(link).toHaveAttribute('target', '_blank')
  })

  it('does not show Settings or Sign out buttons, even when isOwner', () => {
    render(<ProfileHeader profile={profile} isOwner={true} />)
    expect(screen.queryByRole('button', { name: /settings/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /sign out/i })).not.toBeInTheDocument()
  })

  it('renders friends count', () => {
    render(<ProfileHeader profile={profile} isOwner={false} friendsCount={5} />)
    expect(screen.getByText('5')).toBeInTheDocument()
  })
})
