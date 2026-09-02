import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CoverImageUploadInput } from './CoverImageUploadInput'

describe('CoverImageUploadInput', () => {
  it('supports touch-safe dragging to reposition the cover', () => {
    const onPositionChange = vi.fn()
    render(
      <CoverImageUploadInput
        currentCoverImageUrl="https://example.com/cover.jpg"
        file={null}
        onFileChange={vi.fn()}
        positionX={50}
        positionY={50}
        onPositionChange={onPositionChange}
      />,
    )

    const changeButton = screen.getByRole('button', { name: /change cover image/i })
    const dragSurface = changeButton.parentElement!
    expect(dragSurface).toHaveClass('touch-none', 'select-none')

    dragSurface.setPointerCapture = vi.fn()
    dragSurface.releasePointerCapture = vi.fn()
    vi.spyOn(dragSurface, 'getBoundingClientRect').mockReturnValue({
      width: 200,
      height: 100,
      top: 0,
      right: 200,
      bottom: 100,
      left: 0,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })

    fireEvent.pointerDown(dragSurface, { pointerId: 1, clientX: 100, clientY: 50 })
    fireEvent.pointerMove(dragSurface, { pointerId: 1, clientX: 120, clientY: 60 })

    expect(onPositionChange).toHaveBeenCalledWith(40, 40)
  })

  it('does not open the file picker when a drag ends over the upload button', () => {
    render(
      <CoverImageUploadInput
        currentCoverImageUrl="https://example.com/cover.jpg"
        file={null}
        onFileChange={vi.fn()}
        onPositionChange={vi.fn()}
      />,
    )

    const changeButton = screen.getByRole('button', { name: /change cover image/i })
    const dragSurface = changeButton.parentElement!
    const input = screen.getByLabelText(/upload cover image/i)
    const inputClick = vi.spyOn(input, 'click')
    dragSurface.setPointerCapture = vi.fn()
    dragSurface.releasePointerCapture = vi.fn()
    vi.spyOn(dragSurface, 'getBoundingClientRect').mockReturnValue({
      width: 200,
      height: 100,
      top: 0,
      right: 200,
      bottom: 100,
      left: 0,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })

    fireEvent.pointerDown(changeButton, { pointerId: 1, clientX: 100, clientY: 50 })
    fireEvent.pointerMove(changeButton, { pointerId: 1, clientX: 120, clientY: 60 })
    fireEvent.pointerUp(changeButton, { pointerId: 1, clientX: 120, clientY: 60 })
    fireEvent.click(changeButton)

    expect(inputClick).not.toHaveBeenCalled()
  })
})
