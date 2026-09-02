# Find Players Success Snackbar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace persistent success alerts on `FindPlayersPage` with the existing self-dismissing `Toast` snackbar.

**Architecture:** Keep success-message ownership inside `FindPlayersPage` and render the shared `Toast` whenever `successMessage` is non-null. `Toast` owns its existing three-second timer and calls back into the page to clear the message; persistent error alerts and relationship badges remain unchanged.

**Tech Stack:** React 18, TypeScript, Vitest, Testing Library, Tailwind CSS

## Global Constraints

- Reuse `src/components/ui/Toast.tsx`; do not add a dependency or global notification context.
- Apply the snackbar to every success message produced by `FindPlayersPage`.
- Keep errors as persistent inline alerts.
- Keep translated message text unchanged.
- Keep the persistent "Request sent" relationship badge unchanged.

---

### Task 1: Render Success Feedback As A Toast

**Files:**
- Modify: `src/pages/FindPlayersPage.tsx:5-10,298-302`
- Test: `src/pages/FindPlayersPage.test.tsx:62-72`
- Modify: `src/components/ui/Toast.tsx:1-22`
- Create: `src/components/ui/Toast.test.tsx`

**Interfaces:**
- Consumes: `Toast({ message: string, onDismiss: () => void, durationMs?: number })` from `src/components/ui/Toast.tsx`.
- Produces: page-local transient success feedback backed by the existing `successMessage: string | null` state.

- [x] **Step 1: Write the failing test**

Extend the invitation-success test to advance the snackbar's three-second timer and verify that the persistent relationship badge remains:

```tsx
it('shows invitation success temporarily while keeping the request badge', async () => {
  const user = userEvent.setup()
  renderPage()

  await waitFor(() => expect(screen.getByText('Nexus Nova')).toBeInTheDocument())
  await user.click(screen.getByRole('button', { name: /send request/i }))
  vi.useFakeTimers()
  fireEvent.click(screen.getByRole('button', { name: /mock send invitation/i }))

  expect(screen.getByText('Request sent to Nexus Nova.')).toBeInTheDocument()
  expect(screen.getByText('Request sent')).toBeInTheDocument()

  act(() => vi.advanceTimersByTime(3000))

  expect(screen.queryByText('Request sent to Nexus Nova.')).not.toBeInTheDocument()
  expect(screen.getByText('Request sent')).toBeInTheDocument()
})
```

- [x] **Step 2: Run the focused test and verify it fails**

Run: `npx vitest run src/pages/FindPlayersPage.test.tsx`

Expected: FAIL because the current inline success alert remains after three seconds.

- [x] **Step 3: Write the minimal implementation**

Import `Toast`:

```tsx
import { Toast } from '../components/ui/Toast'
```

Replace the inline success alert with:

```tsx
{successMessage && <Toast message={successMessage} onDismiss={() => setSuccessMessage(null)} />}
```

Leave both error-alert blocks and all existing `setSuccessMessage` calls unchanged.

- [x] **Step 4: Run the focused test and verify it passes**

Run: `npx vitest run src/pages/FindPlayersPage.test.tsx`

Expected: both tests PASS.

- [x] **Step 5: Run project verification**

Run in CI order:

```bash
npm run lint
npm test
npm run build
```

Expected: all commands exit with status 0.

- [x] **Step 6: Review the final diff**

Run: `git diff -- src/pages/FindPlayersPage.tsx src/pages/FindPlayersPage.test.tsx src/components/ui/Toast.tsx src/components/ui/Toast.test.tsx docs/superpowers/specs/2026-09-02-find-players-success-snackbar-design.md docs/superpowers/plans/2026-09-02-find-players-success-snackbar.md`

Expected: only the approved snackbar change, its test, and documentation are present. Do not commit unless explicitly requested.
