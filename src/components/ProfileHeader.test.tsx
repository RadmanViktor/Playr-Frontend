import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProfileHeader } from './ProfileHeader'
import type { ProfileData } from '../api/profilesApi'

const profile: ProfileData = {
  userId: 'u1', username: 'nexusnova', displayName: 'Nexus Nova', bio: 'Gaming is life',
  avatarUrl: null, coverImageUrl: null, region: 'EU', languages: ['English', 'Swedish'],
  platforms: ['PC', 'PlayStation'], genres: [], externalLinks: { Steam: 'https://steamcommunity.com/id/nexusnova' },
  status: 'Online' as const, lookingForGameId: null, lookingForGameName: null, lookingForPlayStyle: null, lookingForGameNote: null,
  playstylePreference: null, usuallyPlayingWith: null, typicalPlayTimes: [], hasCompletedOnboarding: true,
  createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  relationshipStatus: null, pendingInvitationId: null,
}

describe('ProfileHeader', () => {
  it('renders displayName and username', () => {
    render(<ProfileHeader profile={profile} isOwner={false} onEditClick={vi.fn()} />)
    expect(screen.getByText('Nexus Nova')).toBeInTheDocument()
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

  it('shows Settings button when isOwner', () => {
    render(<ProfileHeader profile={profile} isOwner={true} onEditClick={vi.fn()} />)
    expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument()
  })

  it('shows Sign out button under Settings when owner can sign out', () => {
    render(<ProfileHeader profile={profile} isOwner={true} onEditClick={vi.fn()} onSignOutClick={vi.fn()} />)
    const settingsButton = screen.getByRole('button', { name: /settings/i })
    const signOutButton = screen.getByRole('button', { name: /sign out/i })
    expect(settingsButton.compareDocumentPosition(signOutButton) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('hides Settings button when not isOwner', () => {
    render(<ProfileHeader profile={profile} isOwner={false} onEditClick={vi.fn()} />)
    expect(screen.queryByRole('button', { name: /settings/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /sign out/i })).not.toBeInTheDocument()
  })

  it('calls onEditClick when Settings is clicked', async () => {
    const onEditClick = vi.fn()
    const user = userEvent.setup()
    render(<ProfileHeader profile={profile} isOwner={true} onEditClick={onEditClick} />)
    await user.click(screen.getByRole('button', { name: /settings/i }))
    expect(onEditClick).toHaveBeenCalledOnce()
  })

  it('calls onSignOutClick when Sign out is clicked', async () => {
    const onSignOutClick = vi.fn()
    const user = userEvent.setup()
    render(<ProfileHeader profile={profile} isOwner={true} onEditClick={vi.fn()} onSignOutClick={onSignOutClick} />)
    await user.click(screen.getByRole('button', { name: /sign out/i }))
    expect(onSignOutClick).toHaveBeenCalledOnce()
  })
})
