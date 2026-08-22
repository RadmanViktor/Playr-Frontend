import { render, screen } from '@testing-library/react'
import { Card, CardHeader } from './Card'

describe('Card', () => {
  it('renders children', () => {
    render(<Card>content</Card>)
    expect(screen.getByText('content')).toBeInTheDocument()
  })

  it('CardHeader renders title and action', () => {
    render(<CardHeader title="Trending Threads" action={<a href="#">View All</a>} />)
    expect(screen.getByText('Trending Threads')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'View All' })).toBeInTheDocument()
  })
})
