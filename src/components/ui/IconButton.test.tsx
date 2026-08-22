import { render, screen } from '@testing-library/react'
import { IconButton } from './IconButton'

describe('IconButton', () => {
  it('renders an accessible icon button', () => {
    render(<IconButton aria-label="Notifications">*</IconButton>)
    expect(screen.getByRole('button', { name: 'Notifications' })).toBeInTheDocument()
  })
})
