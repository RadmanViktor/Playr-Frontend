import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthShell } from './AuthShell'

describe('AuthShell', () => {
  it('renders branding, content, and an optional showcase', () => {
    render(
      <MemoryRouter>
        <AuthShell showcase={<p>Live lobby</p>}>
          <p>Login form</p>
        </AuthShell>
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: 'PLAYR' })).toHaveAttribute('href', '/login')
    expect(screen.getByText('Login form')).toBeInTheDocument()
    expect(screen.getByTestId('auth-showcase')).toHaveTextContent('Live lobby')
  })

  it('works without a showcase', () => {
    render(
      <MemoryRouter>
        <AuthShell><p>Reset form</p></AuthShell>
      </MemoryRouter>,
    )

    expect(screen.getByText('Reset form')).toBeInTheDocument()
    expect(screen.queryByTestId('auth-showcase')).not.toBeInTheDocument()
  })
})
