import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EmojiPickerButton } from './EmojiPickerButton'

describe('EmojiPickerButton', () => {
  it('is hidden below the sm breakpoint and shown from sm up', () => {
    render(<EmojiPickerButton onSelect={vi.fn()} />)

    const wrapper = screen.getByLabelText('Add emoji').parentElement!
    expect(wrapper.className).toContain('hidden')
    expect(wrapper.className).toContain('sm:block')
  })
})
