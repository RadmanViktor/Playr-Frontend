# Recent games in GamePickerInput

## Problem

`GamePickerInput` always fires a live search against RAWG when opened, even
before typing. Users who repeatedly tag the same game (e.g. Counter-Strike 2)
have to re-search it every time. A "recently used games" section, backed by
`src/lib/recentGames.ts`, was started but never finished: `addRecentGameId`
is only called from `CreatePostModal` and `getRecentGameIds` is never read.

## Solution

One shared "recently used games" list, app-wide, shown only when the search
field is empty (falls back to today's RAWG default list if the recent list
is empty).

### `src/lib/recentGames.ts`

- Store full `Game` objects instead of bare IDs (`id`, `name`,
  `coverImageUrl`, `genre`), so the picker can render the list without an
  extra network round-trip.
- `STORAGE_KEY` becomes `playr_recent_games_v2` (old key silently orphaned;
  no migration needed for 5 items).
- API: `getRecentGames(): Game[]`, `addRecentGame(game: Game): void` (dedupe
  by `id`, prepend, cap at 5), `removeRecentGame(id: string): void`.
- Runtime shape guard (`isGame`) filters corrupt/legacy entries, mirroring
  `isRecentSearch` in `recentSearches.ts`.

### `src/components/GamePickerInput.tsx`

- Move the "remember this game" call out of `CreatePostModal` and into
  `selectResult()` here, right after a successful `createGame`, so all 5
  call sites (`CreatePostModal`, `CreateGroupPanel`, `FavoriteGamesSection`,
  `LookingForGamePanel`, `PlayingNowSection`) build/benefit from the same
  list.
- New `recentGames` state, seeded from `getRecentGames()` when the dropdown
  opens.
- When `query.trim() === ''` and `recentGames.length > 0`: render a
  "Recently used" section (same row layout as search results: cover, name,
  a small remove "×" button) instead of firing/showing the RAWG default
  list.
- When `recentGames` is empty, keep today's behavior (RAWG default list on
  open).
- As soon as the user types anything, hide the recent section and use the
  existing debounced RAWG search exactly as today.
- Keyboard nav (Arrow Up/Down/Enter/Escape) reused for both lists; they are
  never shown at the same time so no index-space conflicts.

### `src/components/CreatePostModal.tsx`

- Remove the now-redundant `addRecentGameId` call (line ~112) and its now
  unused import.

### i18n

- Add `gamePickerInput.recentlyUsed` and
  `gamePickerInput.removeRecentGameAriaLabel` (or similar) to the
  `componentsB` namespace for `en` and `sv`.

## Testing

- Update/extend `src/lib/recentGames.test.ts` if present, else add one,
  covering add/dedupe/cap/remove/corrupt-data filtering (mirror
  `recentSearches.ts` tests if they exist).
- Update `GamePickerInput` tests (if present) to cover: recent list shown
  when field empty, hidden while typing, falls back to RAWG list when no
  recent games, selecting a recent game calls `onSelect` directly (no
  `createGame` call needed since it's already a full `Game`).

## Out of scope

- No backend/API changes.
- No per-context (per-feature) recent lists — single shared list.
- No cross-device sync (localStorage only, as before).
