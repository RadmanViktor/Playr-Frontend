import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StatusModal } from './StatusModal'
import { __resetBodyScrollLock } from '../../lib/useBodyScrollLock'
import { afterEach } from 'vitest'

const updateStatus = vi.fn().mockResolvedValue(undefined)

vi.mock('../../context/StatusContext', () => ({
  useStatus: () => ({
    status: 'Online',
    lookingForGameId: null,
    lookingForPlayStyle: null,
    lookingForGameNote: null,
    updateStatus,
  }),
}))

afterEach(() => {
  __resetBodyScrollLock()
  document.body.removeAttribute('style')
  updateStatus.mockClear()
})

describe('StatusModal', () => {
  it('does not offer Looking for game as a status option', () => {
    render(<StatusModal onClose={vi.fn()} />)

    expect(screen.queryByText('Looking for game')).not.toBeInTheDocument()
    expect(screen.getByText('Online')).toBeInTheDocument()
    expect(screen.getByText('Busy')).toBeInTheDocument()
    expect(screen.getByText('Offline')).toBeInTheDocument()
  })

  it('saves with null game and play style fields', async () => {
    const user = userEvent.setup()
    render(<StatusModal onClose={vi.fn()} />)

    await user.click(screen.getByText('Busy'))
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(updateStatus).toHaveBeenCalledWith('Busy', null, null, null)
  })
})
