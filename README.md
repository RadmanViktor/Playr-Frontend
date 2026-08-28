# Playr — frontend

React + TypeScript + Vite. Served at https://www.playr.viktorradman.se

## Development

```bash
npm install
npm run dev
```

The API base URL defaults to `http://localhost:5258` and is overridden for
production builds via `VITE_API_BASE_URL` in `.env.production`.

```bash
npm test        # vitest
npm run lint
npm run build
```

## Deployment

**Deployment is automatic. Push to `main` and you are done.**

`.github/workflows/deploy.yml` runs lint, tests and build on a GitHub-hosted
runner, then rsyncs `dist/` to the server over SSH. The deploy job reuses the
artifact produced by the verify job, so what ships is exactly what was tested,
and a failing build never reaches production.

Pull requests run the verify job only. To redeploy without a new commit, use
**Run workflow** on the Actions tab.

### How it reaches the server

| | |
|---|---|
| Target | `viktor@87.106.19.210:/var/www/playr-frontend` |
| Auth | `SSH_PRIVATE_KEY` secret; host pinned via `SSH_KNOWN_HOSTS` |
| Transfer | `rsync -avz --delete` |

`/var/www/playr-frontend` is owned by `viktor:www-data` so the deploy needs no
`sudo`. **Do not chown it back to `www-data`** — rsync runs as `viktor` and the
deploy will start failing.

### Manual fallback

Only if GitHub Actions is unavailable. Build locally, then from the repo root:

```bash
rsync -avz --delete dist/ viktor@87.106.19.210:/var/www/playr-frontend/
```

Nothing needs to be built on the server; it has no Node installation and no
checkout of this repo.

### Related server configuration

nginx proxies `/api/`, `/hubs/`, `/health` and `/uploads/` to the API on
`127.0.0.1:5258`, and falls back to `index.html` for everything else. Uploaded
media is served from `/uploads/`; without that location block nginx returns
`index.html` for every image and avatars break.

---

## Vite template notes

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default tseslint.config({
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

- Replace `tseslint.configs.recommended` to `tseslint.configs.recommendedTypeChecked` or `tseslint.configs.strictTypeChecked`
- Optionally add `...tseslint.configs.stylisticTypeChecked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and update the config:

```js
// eslint.config.js
import react from 'eslint-plugin-react'

export default tseslint.config({
  // Set the react version
  settings: { react: { version: '18.3' } },
  plugins: {
    // Add the react plugin
    react,
  },
  rules: {
    // other rules...
    // Enable its recommended rules
    ...react.configs.recommended.rules,
    ...react.configs['jsx-runtime'].rules,
  },
})
```
