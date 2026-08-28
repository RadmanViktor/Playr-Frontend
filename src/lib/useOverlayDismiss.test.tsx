import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useOverlayDismiss } from './useOverlayDismiss'

function Overlay({ onDismiss }: { onDismiss: () => void }) {
  const { backdropProps } = useOverlayDismiss({ onDismiss })
  return (
    <div data-testid="backdrop" {...backdropProps}>
      <div data-testid="panel">
        <input aria-label="Message" />
      </div>
    </div>
  )
}

describe('useOverlayDismiss', () => {
  it('dismisses on a clean backdrop tap', async () => {
    const onDismiss = vi.fn()
    render(<Overlay onDismiss={onDismiss} />)

    await userEvent.click(screen.getByTestId('backdrop'))

    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('does not dismiss when the click lands on the panel', async () => {
    const onDismiss = vi.fn()
    render(<Overlay onDismiss={onDismiss} />)

    await userEvent.click(screen.getByTestId('panel'))

    expect(onDismiss).not.toHaveBeenCalled()
  })

  it('does not dismiss when a drag starts on the panel and ends on the backdrop', () => {
    const onDismiss = vi.fn()
    render(<Overlay onDismiss={onDismiss} />)

    const backdrop = screen.getByTestId('backdrop')
    const panel = screen.getByTestId('panel')

    // A scroll/selection gesture that begins inside the panel and drifts out.
    panel.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    backdrop.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(onDismiss).not.toHaveBeenCalled()
  })

  it('dismisses on Escape', async () => {
    const onDismiss = vi.fn()
    render(<Overlay onDismiss={onDismiss} />)

    await userEvent.keyboard('{Escape}')

    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('ignores Escape when closeOnEscape is false', async () => {
    const onDismiss = vi.fn()
    function NoEscape() {
      const { backdropProps } = useOverlayDismiss({ onDismiss, closeOnEscape: false })
      return <div data-testid="backdrop" {...backdropProps} />
    }
    render(<NoEscape />)

    await userEvent.keyboard('{Escape}')

    expect(onDismiss).not.toHaveBeenCalled()
  })
})
