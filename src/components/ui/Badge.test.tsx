import { render, screen } from '@testing-library/react'
import { Badge } from './Badge'

describe('Badge', () => {
  it('renders children with default tag variant', () => {
    render(<Badge>#EldenRing</Badge>)
    const el = screen.getByText('#EldenRing')
    expect(el).toHaveAttribute('data-variant', 'tag')
  })

  it('applies a mood variant', () => {
    render(<Badge variant="need-help">Need Help</Badge>)
    expect(screen.getByText('Need Help')).toHaveAttribute('data-variant', 'need-help')
  })
})
