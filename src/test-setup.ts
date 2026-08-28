import '@testing-library/jest-dom'

// jsdom does not implement PointerEvent at all; MouseEvent carries everything
// the overlay dismissal logic reads (target/currentTarget/bubbles).
if (typeof window.PointerEvent === 'undefined') {
  window.PointerEvent = window.MouseEvent as unknown as typeof window.PointerEvent
  globalThis.PointerEvent = window.PointerEvent
}

// jsdom logs "Not implemented" for scrollTo; the scroll lock calls it on unlock.
if (typeof window.scrollTo !== 'function' || !('mock' in window.scrollTo)) {
  window.scrollTo = (() => {}) as typeof window.scrollTo
}

// jsdom implements neither matchMedia nor visualViewport, both of which the
// mobile layout hooks depend on. Provide controllable stand-ins.

interface MatchMediaState {
  matches: boolean
  listeners: Set<(event: MediaQueryListEvent) => void>
}

const matchMediaStates = new Map<string, MatchMediaState>()

function stateFor(query: string): MatchMediaState {
  let state = matchMediaStates.get(query)
  if (!state) {
    state = { matches: false, listeners: new Set() }
    matchMediaStates.set(query, state)
  }
  return state
}

if (!window.matchMedia) {
  window.matchMedia = ((query: string) => {
    const state = stateFor(query)
    return {
      get matches() {
        return state.matches
      },
      media: query,
      onchange: null,
      addEventListener: (_: string, listener: (event: MediaQueryListEvent) => void) => {
        state.listeners.add(listener)
      },
      removeEventListener: (_: string, listener: (event: MediaQueryListEvent) => void) => {
        state.listeners.delete(listener)
      },
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    } as unknown as MediaQueryList
  }) as typeof window.matchMedia
}

/** Set whether a media query currently matches and notify subscribers. */
export function setMatchMedia(query: string, matches: boolean) {
  const state = stateFor(query)
  state.matches = matches
  for (const listener of state.listeners) {
    listener({ matches, media: query } as MediaQueryListEvent)
  }
}

export function resetMatchMedia() {
  matchMediaStates.clear()
}

class FakeVisualViewport extends EventTarget {
  height = 800
  width = 400
  offsetTop = 0
}

const fakeVisualViewport = new FakeVisualViewport()

if (!window.visualViewport) {
  Object.defineProperty(window, 'visualViewport', {
    configurable: true,
    writable: true,
    value: fakeVisualViewport,
  })
}

/** Simulate the virtual keyboard shrinking the visual viewport. */
export function setVisualViewport({ height, offsetTop = 0 }: { height: number; offsetTop?: number }) {
  const viewport = window.visualViewport as unknown as FakeVisualViewport
  viewport.height = height
  viewport.offsetTop = offsetTop
  viewport.dispatchEvent(new Event('resize'))
}
