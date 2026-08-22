import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AuthPanel } from './AuthPanel'

describe('AuthPanel', () => {
  it('renders the title and children', () => {
    render(
      <AuthPanel title="Log in to PLAYR">
        <p>form goes here</p>
      </AuthPanel>,
    )
    expect(screen.getByText('Log in to PLAYR')).toBeInTheDocument()
    expect(screen.getByText('form goes here')).toBeInTheDocument()
  })
})
