import { render, screen } from '@testing-library/react'
import { SearchInput } from './SearchInput'

describe('SearchInput', () => {
  it('renders a search input with default label', () => {
    render(<SearchInput />)
    expect(screen.getByRole('searchbox', { name: 'Search PLAYR' })).toBeInTheDocument()
  })
})
