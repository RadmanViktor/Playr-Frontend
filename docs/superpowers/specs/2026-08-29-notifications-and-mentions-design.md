# Notification bell and @-mentions in posts/comments

Date: 2026-08-29
Repos: `Playr-Frontend` (primary), `Playr` (backend)

## Problem

Users want to tag each other with `@username` when writing posts or comments, and get
notified when they're tagged. There's currently no general notification feed — only a
narrow "chat sound / browser notification" preferences toggle
(`NotificationPreferencesContext`, `NotificationPreferencesController`). A bell icon should
sit next to the existing Mail (invitations) icon in the header and open a dropdown of
notifications.

Scope for this iteration:
- A general, extensible notification platform (entity + feed + read/unread), but the only
  notification type implemented now is **mention** (in a post or a comment).
- `@username` tagging works both when creating a post and when writing a comment.
- Only **friends** can be tagged (autocomplete is filtered to the user's friends list).
- Clicking a notification navigates to a new dedicated post detail page and marks it read.

Out of scope (future notification types, not built now): likes, new comments on your own
post without a mention, friend request / invitation notifications merged into this feed
(they keep their own existing UI for now).

## Design

### 1. Backend — Notification entity and feed

New domain entity, `Playr.Domain/Notifications/Notification.cs`:

```csharp
public sealed class Notification
{
    public Guid Id { get; init; }
    public Guid RecipientUserId { get; init; }
    public Guid ActorUserId { get; init; }        // who caused it (the tagger)
    public NotificationType Type { get; init; }    // enum, only PostMention/CommentMention for now
    public Guid PostId { get; init; }
    public Guid? CommentId { get; init; }          // null for a post-body mention
    public bool IsRead { get; set; }
    public DateTimeOffset CreatedAt { get; init; }
}

public enum NotificationType
{
    PostMention,
    CommentMention,
}
```

Layering follows the existing Comments/Invitations convention:
- `Playr.Application/Notifications/` — `INotificationService`, `NotificationDto`,
  `INotificationNotifier` (push interface), commands (`MarkNotificationReadCommand`, etc).
  Note: this folder already has `NotificationPreferencesDto`/`INotificationPreferencesService`
  for the chat toggle feature — the new notification-feed types live alongside them, distinct
  names, no conflict.
- `Playr.Infrastructure/Notifications/` — EF Core repository/service implementation,
  migration for the `Notifications` table.
- `Playr.Api/Notifications/` — `NotificationsController`, request/response models,
  `SignalRNotificationNotifier : INotificationNotifier` implementation.

**Endpoints** (`NotificationsController`, `[Authorize]`):
- `GET /api/notifications?skip=0&take=20` → `{ items: NotificationResponse[], unreadCount: int }`
- `POST /api/notifications/{id}/read`
- `POST /api/notifications/read-all`

`NotificationResponse` includes enough to render a row without extra fetches: `id`, `type`,
`isRead`, `createdAt`, `actor { userId, username, displayName, avatarUrl }`, `postId`,
`commentId`.

**Real-time:** reuse the existing `ChatHub` (`/hubs/chat`) — no new hub. When a mention is
created, `SignalRNotificationNotifier` calls
`hubContext.Clients.User(recipientId).SendAsync("NotificationReceived", dto, ct)`, mirroring
`SignalRInvitationNotifier`.

### 2. Backend — Mentions storage and mention detection

Mentions are **not** parsed out of free text at read time as the source of truth — they're
recorded explicitly at write time, because `DisplayName` may contain spaces which makes plain
text parsing ambiguous. `Username` has no spaces, so the text itself uses `@username` tokens,
but the authoritative list of who was tagged travels separately.

New join tables (one for posts, one for comments, since they hang off different parents):

```
PostMention:    Id, PostId,    MentionedUserId, UsernameAtTimeOfPosting
CommentMention: Id, CommentId, MentionedUserId, UsernameAtTimeOfPosting
```

`UsernameAtTimeOfPosting` lets the client render an accurate `@username → profile link` even
if the tagged user later renames themselves — the frontend never has to re-resolve usernames
to render historical text.

**Request changes:**
- `POST /api/posts` and `PUT /api/posts/{id}` — body gains `mentionedUserIds: Guid[]`
  (optional, defaults to empty).
- `POST /api/posts/{postId}/comments` and `PUT .../comments/{commentId}` — body gains
  `mentionedUserIds: Guid[]`.

**Response changes:** `PostResponse` and `CommentResponse` gain a `mentions: MentionResponse[]`
field (`{ userId, username, displayName }`), sourced from the join table, used by the
frontend to render `@username` as a profile link.

**Server-side validation, on create:**
- Each `mentionedUserId` must be a current friend of the author (mirrors the "only friends
  can be tagged" UI rule so it can't be bypassed by calling the API directly). Invalid ids
  are silently dropped rather than erroring the whole request.
- Self-mentions are dropped (no notification for tagging yourself).
- One `Notification` row (`Type = PostMention` or `CommentMention`) is created per valid,
  non-self mentioned user, and pushed live via the notifier.

### 3. Backend — Single post endpoint

New `GET /api/posts/{postId}` → `PostResponse` (same shape already used in the feed list),
needed so the new post detail page can deep-link to one post without walking the whole feed.
`[Authorize]`, 404 if the post doesn't exist or the caller can't see it (same visibility rule
as the feed query).

### 4. Frontend — Notification bell

- New `Bell` icon (lucide-react) added to `TopBar.tsx`, placed in the existing
  `ml-auto flex items-center gap-2` header container, next to the current Mail
  (`aria-label="Messages"`) button.
- Unread badge reuses the existing pattern: `absolute -right-0.5 -top-0.5 ... rounded-full
  bg-frustrated`, capped display "9+".
- Click opens a dropdown (same structural pattern as the invitations dropdown already in
  `TopBar.tsx`): paginated list ("load more" at 20 per page), "Mark all as read" action.
- Each row: actor avatar, text ("**Anna Svensson** tagged you in a comment" /
  "...tagged you in a post"), relative time, unread rows get a highlighted background.
- Row click → `POST /api/notifications/{id}/read`, then navigate to
  `/posts/{postId}` (mention on a post) or `/posts/{postId}?commentId={commentId}`
  (mention in a comment).

New `src/context/NotificationContext.tsx`:
- Holds `notifications`, `unreadCount`, `hasMore`; loads the first page on mount (when
  authenticated) via new `src/api/notificationsApi.ts` (`getNotifications`,
  `markNotificationRead`, `markAllNotificationsRead`).
- Subscribes to a new `onNotificationReceived` export in `src/lib/chatHubConnection.ts`
  (same pattern as `onInvitationReceived`) — prepends the incoming notification, increments
  `unreadCount`.
- On a live notification, shows the existing `Toast` component, and — gated behind the
  existing `NotificationPreferencesContext` toggle used for chat — also calls
  `showBrowserNotification` / `playNotificationSound`. (Reuses the current toggle rather than
  adding a new one, since the ask is just "get a notification", not fine-grained settings.)
- Exposes `useNotifications()`; provider added to the app's context tree alongside
  `ChatProvider`.

### 5. Frontend — Post detail page

- New route `/posts/:postId` in `App.tsx`, protected, inside `AppShell` (same tier as
  `/feed`).
- New `PostDetailPage.tsx`: fetches the post via new `getPost(postId)` in `postsApi.ts`,
  renders it with the existing `PostCard`, but with comments forced open (new `PostCard`
  prop `defaultCommentsOpen`, defaults to `false`, existing feed/profile usages unaffected).
- Reads `?commentId=` via `useSearchParams`. `CommentsSection` gains a new optional prop
  `highlightCommentId`: when set, it loads pages of comments (existing paginated
  `getComments`) until the target comment is found or pages run out, scrolls it into view,
  and applies a brief highlight (background flash, CSS transition, no new dependency).
- If the post doesn't exist or 403/404s, show the existing not-found/empty-state treatment
  used elsewhere (reuse whatever `ProfilePage` does for a missing profile, for consistency).

### 6. Frontend — @-mention input

New reusable `src/components/MentionInput.tsx`, wrapping a plain `<textarea>`:
- Tracks cursor position; when the text immediately before the cursor matches
  `/@(\w*)$/`, opens an autocomplete dropdown positioned under the caret.
- Dropdown options come from the current user's friends (`getFriends`, already fetched
  once and cached at the context/page level — no new endpoint needed), filtered
  client-side by substring match against `username` and `displayName`.
- Selecting a friend replaces the partial `@token` with `@{username}` (username has no
  spaces, so this is unambiguous) and appends `{userId, username, displayName}` to a local
  `mentions: MentionDraft[]` array kept alongside the text value.
- Exposes `{ value, mentions }` to the parent via `onChange`; parent (`CreatePostModal`,
  `CommentsSection`'s composer) sends `mentionedUserIds: mentions.map(m => m.userId)` in the
  create/update request body.
- `CreatePostModal.tsx` and the comment-composing input in `CommentsSection.tsx` are
  updated to use `MentionInput` instead of their current plain textarea/input.

**Rendering:** `src/lib/linkify.tsx` gains an `@username` pattern (parallel to the existing
`#hashtag` highlighting), matched against the `mentions` array that now comes back on
`PostResponse`/`CommentResponse`. A match renders as a link to `/profile/:username`
(existing route); a `@token` with no matching entry in `mentions` (e.g. user typed a literal
`@` without picking someone) renders as plain text, not a link.

## Testing

- Backend: unit tests for mention validation (friend-only, self-mention dropped) and
  notification creation on `CommentsController`/`PostsController` create paths; controller
  tests for the three new `NotificationsController` endpoints.
- Frontend: component tests for `MentionInput` (autocomplete filtering, insertion), for the
  bell dropdown (unread badge, mark-as-read), and for `linkify.tsx`'s new `@username` case.
  Existing `TopBar.test.tsx` and `CommentsSection.test.tsx` extended for the new
  props/behavior rather than duplicated.
