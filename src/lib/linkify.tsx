import type { ReactNode } from 'react'

const URL_SPLIT_PATTERN = /(https?:\/\/[^\s]+)/g
const URL_TEST_PATTERN = /^https?:\/\/[^\s]+$/
const HASHTAG_SPLIT_PATTERN = /(#[a-zA-Z0-9_]+)/g
const HASHTAG_TEST_PATTERN = /^#[a-zA-Z0-9_]+$/

/**
 * Renders post text with URLs turned into clickable links and #hashtags
 * visually highlighted (no navigation/filtering behavior for hashtags).
 */
export function linkify(text: string): ReactNode[] {
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
      if (hashtagPart) nodes.push(<span key={key++}>{hashtagPart}</span>)
    }
  }

  return nodes
}
