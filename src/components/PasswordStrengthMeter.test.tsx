import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PasswordStrengthMeter } from './PasswordStrengthMeter'

describe('PasswordStrengthMeter', () => {
  it('reports a weak password and asks for a stronger one', () => {
    render(<PasswordStrengthMeter password="abc" />)
    expect(screen.getByRole('status')).toHaveTextContent(/password strength: weak/i)
    expect(screen.getByRole('status')).toHaveTextContent(/choose a stronger password/i)
  })

  it('reports a strong password without the warning', () => {
    render(<PasswordStrengthMeter password="Tr0ub4dor&Elephant" />)
    expect(screen.getByRole('status')).toHaveTextContent(/password strength: strong/i)
    expect(screen.getByRole('status')).not.toHaveTextContent(/choose a stronger password/i)
  })

  it('lists every requirement', () => {
    render(<PasswordStrengthMeter password="" />)
    expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument()
    expect(screen.getByText(/a lowercase letter/i)).toBeInTheDocument()
    expect(screen.getByText(/an uppercase letter/i)).toBeInTheDocument()
    expect(screen.getByText(/^a number$/i)).toBeInTheDocument()
    expect(screen.getByText(/a symbol/i)).toBeInTheDocument()
  })

  it('marks met requirements distinctly from unmet ones', () => {
    render(<PasswordStrengthMeter password="password" />)
    // Met: length + lowercase. Unmet: uppercase, number, symbol.
    expect(screen.getByText(/at least 8 characters/i).closest('li')).toHaveClass('text-enjoying')
    expect(screen.getByText(/^a number$/i).closest('li')).not.toHaveClass('text-enjoying')
  })
})
