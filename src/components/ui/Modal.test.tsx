import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Modal } from './Modal'
import { __resetBodyScrollLock } from '../../lib/useBodyScrollLock'

afterEach(() => {
  __resetBodyScrollLock()
  document.body.removeAttribute('style')
})

describe('Modal', () => {
  it('constrains its height and scrolls internally', () => {
    render(
      <Modal title="Settings" onClose={vi.fn()}>
        <p>Body</p>
      </Modal>,
    )

    const panel = screen.getByRole('heading', { name: 'Settings' }).closest('div')!.parentElement!

    // Without these, tall content is centred off both edges of a short
    // viewport and the action buttons become unreachable.
    expect(panel.className).toContain('max-h-[90svh]')
    expect(panel.className).toContain('overflow-y-auto')
  })

  it('locks background scroll while open', () => {
    const { unmount } = render(
      <Modal title="Settings" onClose={vi.fn()}>
        <p>Body</p>
      </Modal>,
    )

    expect(document.body.style.overflow).toBe('hidden')

    unmount()
    expect(document.body.style.overflow).toBe('')
  })

  it('closes on the close button', async () => {
    const onClose = vi.fn()
    render(
      <Modal title="Settings" onClose={onClose}>
        <p>Body</p>
      </Modal>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Close' }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not close when interacting with its content', async () => {
    const onClose = vi.fn()
    render(
      <Modal title="Settings" onClose={onClose}>
        <input aria-label="Name" />
      </Modal>,
    )

    await userEvent.click(screen.getByLabelText('Name'))

    expect(onClose).not.toHaveBeenCalled()
  })

  it('closes on Escape', async () => {
    const onClose = vi.fn()
    render(
      <Modal title="Settings" onClose={onClose}>
        <p>Body</p>
      </Modal>,
    )

    await userEvent.keyboard('{Escape}')

    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
