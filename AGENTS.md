# AGENTS.md

Playr frontend: React 18 + TypeScript + Vite + Tailwind v4. API is a separate backend, proxied via nginx in production and reached directly at `http://localhost:5258` in dev. The backend repo lives in the sibling folder `../Playr`.

## Commands

```bash
npm run dev         # vite dev server on :5173
npm test             # vitest run (single run, not watch)
npm run lint         # eslint .
npm run build        # tsc -b && vite build (type errors fail the build)
```

Run a single test file: `npx vitest run src/components/PostCard.test.tsx`
Run tests matching a name: `npx vitest run -t "some test name"`

CI (`.github/workflows/deploy.yml`) runs `lint -> test -> build` in that order on every push/PR; match this order locally before pushing.

## Architecture

- `src/api/*.ts` — one file per backend resource (thin fetch wrappers). `src/api/http.ts` has `API_BASE_URL` and `resolveMediaUrl()` — always use `resolveMediaUrl` for any server-relative path (avatars, uploads, media) instead of concatenating strings; it must pass through absolute/blob/data URLs unchanged.
- `src/context/*` — app-wide state via React Context (Auth, Chat, Notifications, Status, CreatePostModal). `AuthContext` gates access; see `ProtectedRoute.tsx`.
- `src/pages/*` — route-level components (one per route, matches `react-router-dom` routes in `App.tsx`).
- `src/components/*`, `src/components/{layout,ui}` — shared/presentational components.
- `src/lib/*` — framework-agnostic hooks/utilities (e.g. `useIdleTimer`, `useIsMobile`, `chatHubConnection.ts` for SignalR).
- `src/utils/*` — pure helpers with no framework deps (e.g. `validation.ts`).
- `src/i18n` — i18next setup; UI strings should go through translations, not be hardcoded.

## Conventions

- Tests are colocated as `Foo.test.tsx`/`.test.ts` next to the file under test, using Vitest + Testing Library (`jsdom` env, globals on, setup in `src/test-setup.ts`). Most components/hooks/API modules have a matching test file — check for one before assuming there isn't a pattern to follow.
- API base URL: `VITE_API_BASE_URL` (set in `.env.production` for prod); defaults to `http://localhost:5258` locally. Don't hardcode API origins elsewhere.
- Real-time chat/notifications use `@microsoft/signalr` (`src/lib/chatHubConnection.ts`), not polling.

## Deployment (do not break)

- Push to `main` auto-deploys: GitHub Actions builds, then `rsync --delete`s `dist/` straight to `/var/www/playr-frontend` on the prod server. There is no server-side build step and no repo checkout there — whatever `npm run build` produces locally/in-CI is exactly what ships.
- The deploy job reuses the artifact from the verify (lint/test/build) job, so a failing lint/test/build never reaches production.
- nginx proxies `/api/`, `/hubs/`, `/health`, `/uploads/` to the API on `127.0.0.1:5258` and falls back to `index.html` for all other paths (SPA routing). Uploaded media is served from `/uploads/` — this must stay proxied or avatars/images break.
