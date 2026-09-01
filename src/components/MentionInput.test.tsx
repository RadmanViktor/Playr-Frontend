import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MentionInput, type MentionDraft } from './MentionInput'

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ token: 'test-token' }),
}))

vi.mock('../api/friendsApi', () => ({
  getFriends: vi.fn(async () => []),
}))

beforeEach(() => {
  vi.resetAllMocks()
})

describe('MentionInput — stale mention removal', () => {
  it('drops a stale mention whose username is only a substring of another @token left in the text', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    // "Ty" is a stale mention draft. The visible text only contains "@TyyD",
    // which is a *different* user whose username happens to start with "Ty".
    const staleMentions: MentionDraft[] = [
      { userId: 'user-ty', username: 'Ty', displayName: 'Ty' },
    ]

    render(
      <MentionInput
        value="hello @TyyD"
        mentions={staleMentions}
        onChange={onChange}
        ariaLabel="post text"
      />
    )

    const textarea = screen.getByLabelText('post text')
    // Trigger a change event without altering the substring relationship,
    // e.g. appending a space at the end.
    await user.type(textarea, ' ')

    expect(onChange).toHaveBeenCalled()
    const [, mentionsArg] = onChange.mock.calls[onChange.mock.calls.length - 1]
    expect(mentionsArg).toEqual([])
  })

  it('keeps a mention whose exact @token is still present in the text', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    const mentions: MentionDraft[] = [
      { userId: 'user-tyyd', username: 'TyyD', displayName: 'TyyD' },
    ]

    render(
      <MentionInput
        value="hello @TyyD"
        mentions={mentions}
        onChange={onChange}
        ariaLabel="post text"
      />
    )

    const textarea = screen.getByLabelText('post text')
    await user.type(textarea, ' ')

    expect(onChange).toHaveBeenCalled()
    const [, mentionsArg] = onChange.mock.calls[onChange.mock.calls.length - 1]
    expect(mentionsArg).toEqual(mentions)
  })
})
