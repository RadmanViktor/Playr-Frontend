# Find Players Success Snackbar

## Problem

`FindPlayersPage` renders success feedback as a permanent inline alert. In
particular, sending an invitation leaves "Request sent to ..." visible until
another action or navigation changes the page.

## Solution

Reuse the existing `Toast` component for every success message on
`FindPlayersPage`.

- Keep the existing `successMessage` state and all current translated message
  text.
- Replace the inline success alert with `Toast`.
- Clear `successMessage` through `Toast.onDismiss`.
- Use the component's existing three-second default duration and manual dismiss
  button.
- Keep cancellation and group-action errors as persistent inline alerts.

This remains page-local. A global toast context is unnecessary because the
page already owns all relevant success events and the shared `Toast` provides
the desired behavior.

## Testing

Update `FindPlayersPage.test.tsx` to verify that invitation success feedback is
shown immediately and automatically disappears after three seconds. Preserve
the existing assertion that the player's relationship badge changes to
"Request sent"; the badge is persistent state, not transient feedback.

## Out Of Scope

- Changing success feedback on other pages.
- Changing error-message behavior.
- Adding a global notification queue or a new snackbar component.
- Changing translated message text.
