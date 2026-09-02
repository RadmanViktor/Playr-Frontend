import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BadgeUnlockCelebration } from './BadgeUnlockCelebration'

describe('BadgeUnlockCelebration', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows the badge name and its description', () => {
    render(<BadgeUnlockCelebration badgeType="Voidtouched" onClose={vi.fn()} />)

    const dialog = screen.getByRole('dialog', { name: 'Congratulations!' })
    expect(dialog).toBeInTheDocument()
    expect(dialog).toHaveFocus()
    expect(screen.getByText('Voidtouched')).toBeInTheDocument()
    expect(screen.getByText(/Hallownest/i)).toBeInTheDocument()
    expect(screen.getByTestId('badge-celebration-emblem')).toHaveClass('badge-celebration-emblem-voidtouched')
  })

  it('closes from the button and Escape', () => {
    const onClose = vi.fn()
    const underlyingHandler = vi.fn()
    document.addEventListener('keydown', underlyingHandler)
    const { rerender } = render(<BadgeUnlockCelebration badgeType="Poster" onClose={onClose} />)

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    expect(onClose).toHaveBeenCalledOnce()

    onClose.mockClear()
    rerender(<BadgeUnlockCelebration badgeType="Poster" onClose={onClose} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledOnce()
    expect(underlyingHandler).not.toHaveBeenCalled()
    document.removeEventListener('keydown', underlyingHandler)
  })

  it('closes automatically after twelve seconds', () => {
    vi.useFakeTimers()
    const onClose = vi.fn()
    render(<BadgeUnlockCelebration badgeType="GameCritic" onClose={onClose} />)

    act(() => vi.advanceTimersByTime(12_000))

    expect(onClose).toHaveBeenCalledOnce()
  })

  it('lets the user stop the automatic close timer', () => {
    vi.useFakeTimers()
    const onClose = vi.fn()
    render(<BadgeUnlockCelebration badgeType="Voidtouched" onClose={onClose} />)

    fireEvent.click(screen.getByRole('button', { name: 'Keep open' }))
    act(() => vi.advanceTimersByTime(12_000))

    expect(onClose).not.toHaveBeenCalled()
  })
})
