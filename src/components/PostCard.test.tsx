import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PostCard } from './PostCard'
import type { PostFeedItem } from '../api/postsApi'

const base: PostFeedItem = {
  id: '1', authorId: 'a', authorUsername: 'nexusnova', authorDisplayName: 'NexusNova',
  authorAvatarUrl: null, gameId: 'g', gameName: 'Elden Ring', gameCoverImageUrl: null,
  textContent: 'Finally beat Radahn!', mood: 'Enjoying',
  createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
}

describe('PostCard', () => {
  it('renders author display name and username', () => {
    render(<PostCard post={base} />)
    expect(screen.getByText('NexusNova')).toBeInTheDocument()
    expect(screen.getByText('@nexusnova')).toBeInTheDocument()
  })

  it('renders game name', () => {
    render(<PostCard post={base} />)
    expect(screen.getByText('Elden Ring')).toBeInTheDocument()
  })

  it('renders text content', () => {
    render(<PostCard post={base} />)
    expect(screen.getByText('Finally beat Radahn!')).toBeInTheDocument()
  })

  it('renders mood badge when mood is set', () => {
    render(<PostCard post={base} />)
    expect(screen.getByText('Enjoying')).toBeInTheDocument()
  })

  it('renders no mood badge when mood is null', () => {
    render(<PostCard post={{ ...base, mood: null }} />)
    expect(screen.queryByText('Enjoying')).not.toBeInTheDocument()
  })

  it('maps NeedHelp mood to need-help badge variant', () => {
    render(<PostCard post={{ ...base, mood: 'NeedHelp' }} />)
    const badge = screen.getByText('Need Help')
    expect(badge).toHaveAttribute('data-variant', 'need-help')
  })

  it('renders a relative timestamp', () => {
    render(<PostCard post={base} />)
    expect(screen.getByText(/ago/i)).toBeInTheDocument()
  })
})
