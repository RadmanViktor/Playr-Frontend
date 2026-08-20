import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TerminalFrame } from './TerminalFrame'

describe('TerminalFrame', () => {
  it('renders the title bar and children content', () => {
    render(
      <TerminalFrame title="playr_auth --login">
        <p>form goes here</p>
      </TerminalFrame>
    )

    expect(screen.getByText('> playr_auth --login')).toBeInTheDocument()
    expect(screen.getByText('form goes here')).toBeInTheDocument()
  })
})
