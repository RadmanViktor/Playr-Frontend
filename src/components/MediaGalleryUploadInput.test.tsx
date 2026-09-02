import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MediaGalleryUploadInput } from './MediaGalleryUploadInput'

beforeEach(() => {
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:preview')
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
})

describe('MediaGalleryUploadInput', () => {
  it('renders a full-width keyboard-accessible upload surface', async () => {
    const user = userEvent.setup()
    render(<MediaGalleryUploadInput files={[]} onFilesChange={vi.fn()} />)

    const uploadButton = screen.getByRole('button', { name: /upload photos or video/i })
    const input = document.querySelector<HTMLInputElement>('input[type="file"]')!
    const inputClick = vi.spyOn(input, 'click')

    expect(uploadButton).toHaveClass('w-full', 'min-h-28')
    await user.click(uploadButton)
    expect(inputClick).toHaveBeenCalledOnce()
  })

  it('adds images dropped on the upload surface', async () => {
    const onFilesChange = vi.fn()
    render(<MediaGalleryUploadInput files={[]} onFilesChange={onFilesChange} />)
    const uploadButton = screen.getByRole('button', { name: /upload photos or video/i })
    const file = new File(['image'], 'screenshot.jpg', { type: 'image/jpeg' })

    fireEvent.drop(uploadButton, { dataTransfer: { files: [file] } })

    await waitFor(() => expect(onFilesChange).toHaveBeenCalledWith([file]))
  })
})
