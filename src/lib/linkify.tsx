import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { MentionItem } from '../api/postsApi'

const URL_SPLIT_PATTERN = /(https?:\/\/[^\s]+)/g
const URL_TEST_PATTERN = /^https?:\/\/[^\s]+$/
const HASHTAG_SPLIT_PATTERN = /(#[a-zA-Z0-9_]+)/g
const HASHTAG_TEST_PATTERN = /^#[a-zA-Z0-9_]+$/
const MENTION_SPLIT_PATTERN = /(@[a-zA-Z0-9_]+)/g
const MENTION_TEST_PATTERN = /^@[a-zA-Z0-9_]+$/

/**
 * Renders post/comment text with URLs turned into clickable links, #hashtags
 * visually highlighted (no navigation/filtering behavior for hashtags), and
 * @username mentions linked to that user's profile - but only when the
 * username is present in `mentions` (the authoritative list of who was
 * actually tagged when the post/comment was created), so a literal "@word"
 * the author typed without picking someone from the autocomplete stays plain text.
 */
export function linkify(text: string, mentions: MentionItem[] = []): ReactNode[] {
  const mentionUsernames = new Set(mentions.map((m) => m.username.toLowerCase()))
  const nodes: ReactNode[] = []
  let key = 0

  for (const urlPart of text.split(URL_SPLIT_PATTERN)) {
    if (URL_TEST_PATTERN.test(urlPart)) {
      nodes.push(
        <a
          key={key++}
          href={urlPart}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline break-all"
        >
          {urlPart}
        </a>,
      )
      continue
    }

    for (const hashtagPart of urlPart.split(HASHTAG_SPLIT_PATTERN)) {
      if (HASHTAG_TEST_PATTERN.test(hashtagPart)) {
        nodes.push(
          <span key={key++} className="font-medium text-primary">
            {hashtagPart}
          </span>,
        )
        continue
      }

      for (const mentionPart of hashtagPart.split(MENTION_SPLIT_PATTERN)) {
        if (MENTION_TEST_PATTERN.test(mentionPart) && mentionUsernames.has(mentionPart.slice(1).toLowerCase())) {
          nodes.push(
            <Link key={key++} to={`/profile/${mentionPart.slice(1)}`} className="font-medium text-primary hover:underline">
              {mentionPart}
            </Link>,
          )
          continue
        }
        if (mentionPart) nodes.push(<span key={key++}>{mentionPart}</span>)
      }
    }
  }

  return nodes
}

/**
 * Renders chat message text with @username mentions visually highlighted -
 * but only when the username belongs to one of the conversation's
 * participants, so a literal "@word" that isn't a real participant stays
 * plain text. Unlike `linkify`, this isn't turned into a profile link since
 * chat messages don't carry an authoritative `mentions` list from the
 * backend, and it uses a different highlight color when the message bubble
 * is the current user's own (bg-primary), so the tag doesn't blend into the
 * plain white message text.
 */
export function linkifyChatMessage(text: string, validUsernames: Iterable<string>, isMine: boolean): ReactNode[] {
  const usernames = new Set(Array.from(validUsernames, (username) => username.toLowerCase()))
  const nodes: ReactNode[] = []
  let key = 0
  const mentionClassName = isMine ? 'font-semibold text-yellow-300' : 'font-semibold text-primary'

  for (const mentionPart of text.split(MENTION_SPLIT_PATTERN)) {
    if (MENTION_TEST_PATTERN.test(mentionPart) && usernames.has(mentionPart.slice(1).toLowerCase())) {
      nodes.push(
        <span key={key++} className={mentionClassName}>
          {mentionPart}
        </span>,
      )
      continue
    }
    if (mentionPart) nodes.push(<span key={key++}>{mentionPart}</span>)
  }

  return nodes
}
