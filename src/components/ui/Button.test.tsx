import { render, screen } from '@testing-library/react'
import { Button } from './Button'

describe('Button', () => {
  it('renders children and defaults to primary variant', () => {
    render(<Button>Post</Button>)
    const btn = screen.getByRole('button', { name: 'Post' })
    expect(btn).toHaveAttribute('data-variant', 'primary')
  })

  it('applies the requested variant', () => {
    render(<Button variant="ghost">More</Button>)
    expect(screen.getByRole('button', { name: 'More' })).toHaveAttribute('data-variant', 'ghost')
  })

  it('forwards native button props', () => {
    render(<Button disabled>Nope</Button>)
    expect(screen.getByRole('button', { name: 'Nope' })).toBeDisabled()
  })
})
