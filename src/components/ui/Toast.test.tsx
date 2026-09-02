import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import { Toast } from './Toast'

describe('Toast', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('announces its message as a status', () => {
    render(<Toast message="Request sent" onDismiss={() => {}} />)

    expect(screen.getByRole('status')).toHaveTextContent('Request sent')
  })

  it('does not restart its timer when its parent rerenders', () => {
    vi.useFakeTimers()
    const firstDismiss = vi.fn()
    const latestDismiss = vi.fn()
    const { rerender } = render(<Toast message="Request sent" onDismiss={firstDismiss} />)

    act(() => vi.advanceTimersByTime(2000))
    rerender(<Toast message="Request sent" onDismiss={latestDismiss} />)
    act(() => vi.advanceTimersByTime(1000))

    expect(firstDismiss).not.toHaveBeenCalled()
    expect(latestDismiss).toHaveBeenCalledOnce()
  })
})
