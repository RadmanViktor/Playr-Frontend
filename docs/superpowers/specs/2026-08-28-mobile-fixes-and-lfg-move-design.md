# Mobile fixes and moving "Looking for game" to Find Players

Date: 2026-08-28
Repos: `Playr-Frontend` (primary), `Playr` (backend, for the note field only)

## Problem

Four issues reported from mobile use:

1. The emoji picker button is redundant on mobile — phones supply their own emoji keyboard.
2. Focusing the chat input zooms the page in.
3. The status modal is visually trapped inside the navigation drawer instead of covering the viewport.
4. Setting "Looking for game" belongs on the Find Players page, not in the status modal. It should also carry an optional free-text note describing what the user is after.

## Design

### 1. Hide the emoji picker on mobile

`src/components/EmojiPickerButton.tsx:30` — the wrapper `<div className="relative">` becomes
`<div className="relative hidden sm:block">`.

Hiding at the component root covers every consumer in one change:
`ChatWindow.tsx:243`, `CommentItem.tsx:114`, `CommentsSection.tsx:138`,
`CreatePostModal.tsx:188`, `PostCard.tsx:228`.

The breakpoint is `sm` (640px), matching the breakpoint the chat window already uses to
switch between fullscreen and docked layouts.

### 2. Stop focus-zoom on inputs

iOS Safari zooms when a focused form control has a computed `font-size` below 16px. The app
has no safeguard: `src/index.css` sets no font-size floor, and `index.html:6` deliberately
omits `maximum-scale`/`user-scalable=no` (suppressing zoom entirely would be an
accessibility regression).

Add to `src/index.css`:

```css
@media (max-width: 639px) {
  input,
  textarea,
  select {
    font-size: 16px;
  }
}
```

Accepted consequence: form-control text grows from 14px to 16px on screens under 640px.
This is intentional. Desktop rendering is unchanged. This fixes the chat composer
(`ChatWindow.tsx:236`) along with search, login, register, comment and profile-edit fields
in a single rule, rather than patching each `text-sm` occurrence.

### 3. Render modals in a portal

Root cause: `AppShell.tsx:51` applies `translate-x-*` to the mobile `<aside>` for the drawer
slide animation. A transformed element becomes the containing block for `position: fixed`
descendants. `StatusModal` is rendered inside that `<aside>` (`Sidebar.tsx:106`) and
`Modal.tsx:21` is `fixed inset-0`, so the modal is clamped to the drawer's
`w-72 max-w-[85vw]` box.

Fix in `src/components/ui/Modal.tsx`: wrap the returned tree in
`createPortal(..., document.body)`.

This is preferred over lifting `StatusModal` up to `AppShell`. Lifting fixes one symptom;
the portal fixes the class of bug for every current and future modal, and removes the
constraint that modals must not be nested inside transformed or `overflow-hidden`
ancestors.

Stacking: the drawer container is `z-50`; the portal appends to the end of `<body>`, so the
modal wins on document order at equal `z-index`. `useBodyScrollLock` and `useOverlayDismiss`
are unaffected — they operate on `document.body` and on the backdrop element respectively.

Testing note: React Testing Library queries `document.body` by default, so `screen.*`
queries continue to find portalled content.

### 4. Move "Looking for game" to Find Players

#### 4a. Backend: `LookingForGameNote`

A nullable note, max 200 characters, stored on the profile.

- `src/Playr.Domain/Profiles/UserProfile.cs` — add `public string? LookingForGameNote { get; set; }`
  next to `LookingForPlayStyle` (L22).
- `src/Playr.Infrastructure/Data/PlayrDbContext.cs` — add
  `profile.Property(p => p.LookingForGameNote).HasMaxLength(200);` in the `UserProfile`
  configuration block (L48-85), following the `Bio` pattern at L54.
- New migration in `src/Playr.Infrastructure/Migrations/` using the
  `yyyyMMddHHmmss_PascalCaseName` convention, plus a snapshot update. Template:
  `20260827192558_AddChatNotificationPreferences.cs`. Provider is Npgsql; the column is
  nullable `character varying(200)`.
- DTOs — `src/Playr.Application/Profiles/`: `ProfileDto.cs`, `UpdateStatusCommand.cs`,
  `LookingForGamePlayerDto.cs`. `ProfileDto` has optional trailing parameters (L23-24), so
  a new required parameter must be inserted before them.
- API models — `src/Playr.Api/Models/Profiles/`: `ProfileResponse.cs`,
  `UpdateStatusRequest.cs`, `LookingForGamePlayerResponse.cs`.
- `src/Playr.Api/Controllers/ProfilesController.cs` — command construction (L68),
  `ToResponse` (L127-129), looking-for-game list mapping (L154-163).
- `src/Playr.Infrastructure/Profiles/ProfileService.cs` — add a
  `MaxLookingForNoteLength = 200` constant alongside the others (L16-22); normalize via the
  existing `NormalizeOptionalText` helper (L289) inside `UpdateStatusAsync` (L118-163);
  update `ToDto` (L188-206) and the list projection (L361-374).

  **Critical:** the clear branch at L149-153, which runs when the status leaves
  `LookingForGame`, must also null the note. Otherwise a stale note survives and reappears
  the next time the user starts looking.

- Validation follows existing house style: a `[StringLength(200)]` data annotation on
  `UpdateStatusRequest` (mirroring `UpdateProfileRequest.cs:6-8`) plus service-side
  normalization. The solution uses no request-level FluentValidation.

- Tests to repair: `tests/Playr.Application.Tests/UnitTest1.cs:84-100` constructs
  `ProfileDto` positionally and will break on the signature change;
  `tests/Playr.IntegrationTests/ProfileEndpointConfigurationTests.cs:133,142` contains a
  `ThrowingProfileService` stub that must track the interface.
- Tests to add: `UpdateStatusAsync` note handling — persisted when looking, whitespace
  trimmed, empty-after-trim stored as `null`, over-length input **rejected with a validation
  error** (not silently truncated, matching `NormalizeOptionalText`'s behaviour for `Bio`),
  and cleared when status changes away from `LookingForGame`. `tests/Playr.Application.Tests/Profiles/ProfileServiceTests.cs` is the
  natural home; it currently covers only `UpdateCurrentUserAsync`.

#### 4b. Frontend API layer

`src/api/profilesApi.ts` — add `lookingForGameNote: string | null` to `ProfileData` (L8-27)
and `LookingForGamePlayer` (L131-141), and `lookingForGameNote?: string | null` to
`UpdateStatusData` (L39-43).

`src/context/StatusContext.tsx` — add `lookingForGameNote` to `StatusContextValue`, to the
provider state, to the hydrate effect (L47-54), to the logged-out reset (L35-43), and to
`updateStatus`, which gains a fourth parameter forwarded to `updateProfileStatus`.

#### 4c. StatusModal simplification

`src/components/ui/StatusModal.tsx` loses everything specific to looking for a game:

- `LookingForGame` is removed from `statusOptions` (L16). Remaining: Online, Busy, Offline.
- The game `Select`, the play-style buttons, `playStyleOptions`, the `getGames` effect
  (L36-48), `needsGameSelection` (L50) and the `games`/`selectedGameId`/`selectedPlayStyle`
  state are all removed.
- `handleSave` calls `updateStatus(selectedStatus, null, null, null)`, clearing any active
  looking-for-game state.

Edge case — the user is currently `LookingForGame`, so no option is highlighted. The modal
shows an explanatory line above the options: *"You're looking for a game. Manage that on
Find Players."* Saving a different status ends the search, which is the expected reading of
picking Online/Busy/Offline.

`Sidebar.tsx:69-71` keeps rendering `Looking for {gameName}` — it is display-only and needs
no change.

#### 4d. Find Players page

A new panel above the player list in `src/pages/FindPlayersPage.tsx`, extracted into
`src/components/LookingForGamePanel.tsx` so `FindPlayersPage` does not accumulate a second
responsibility. Props: `onChanged: () => void`. It reads and writes state through
`useStatus()`.

Idle state:
- Heading "Looking for a game?"
- Game `Select` (options from `getGames()`)
- Competitive / Chill toggle, reusing the existing two-button styling from `StatusModal`
- Optional note `input`, `maxLength={200}`, placeholder "Anything specific? (optional)",
  with a character counter
- Primary button **Start looking**

Active state (`status === 'LookingForGame'`):
- Badges for the selected game and play style, and the note if set
- Ghost button **Stop looking** → `updateStatus('Online', null, null, null)`

Validation and error messaging carry over from the current `handleSave` (L52-73): a game and
a play style are both required; the failure message is "Choose a game and a play style."

After either action succeeds, `FindPlayersPage` re-runs `loadPlayers()` via the `onChanged`
callback so the list reflects the change.

The note is displayed on each player card in the list, below the existing game and play-style
badges (`FindPlayersPage.tsx:125-137`), as muted `text-xs` with `line-clamp-2`.

## Ordering

Backend first — entity, migration, DTOs, service, controller, tests — then the frontend API
layer, then the UI. The frontend note field is inert until the backend is deployed. Items 1,
2 and 3 are independent of the backend and can land in any order.

## Testing

- Existing suites in both repos must pass. `Sidebar.test.tsx`, `FindPlayersPage.test.tsx`,
  `TopBar.test.tsx` and `AppShell.test.tsx` reference status behaviour and will need updates.
- Frontend: assert that `StatusModal` no longer offers "Looking for game"; that the Find
  Players panel starts and stops a search and refreshes the list; that a note round-trips and
  renders on player cards.
- Backend: the `UpdateStatusAsync` cases listed in 4a, including note clearing on status
  change.
- Items 1-3 are CSS and DOM-structure changes verified by manual check on a phone-sized
  viewport; a regression test asserting the modal portals to `document.body` is worth adding.
