<!-- generated-by: gsd-doc-writer -->
# Configuration

## Scope

This project has a small configuration surface. The runtime is split across:

- `apps/web`: Vite frontend, using `VITE_` variables
- `apps/api`: Fastify read-only content service, using process env at startup
- root `package.json` and `scripts/*.mjs`: shared workspace scripts and local dev orchestration

The canonical quiz content source is `questionedit/questionnewV2.md`. No database, auth provider, or external CMS configuration exists in the repository.

## Frontend Environment

`apps/web` reads these variables in `apps/web/src/entities/quiz/api/quizContent.ts` and `apps/web/vite.config.ts`.

### `VITE_API_BASE_URL`

- Purpose: browser-side request prefix for quiz content fetches
- Default: `/api`
- Used by:
  - `fetchQuizMeta()` -> `${VITE_API_BASE_URL}/quiz/meta`
  - `fetchQuizContent()` -> `${VITE_API_BASE_URL}/quiz/content`

Use cases:

- Same-origin local dev: keep `/api`
- Reverse-proxied deploy: keep `/api`
- Split-domain deploy: set a full API prefix such as `https://api.example.com/api`

### `VITE_API_PROXY_TARGET`

- Purpose: Vite development proxy target for `/api`
- Default: `http://127.0.0.1:3001`
- Used only in `apps/web/vite.config.ts`

If frontend and API run on different local ports, Vite forwards `/api/*` to this target during `npm run dev:web`.

### Example

```bash
# apps/web/.env.local
VITE_API_BASE_URL=/api
VITE_API_PROXY_TARGET=http://127.0.0.1:3001
```

## API Environment

`apps/api` currently uses two environment variables.

### `PORT`

- Purpose: API listen port
- Default: `3001`
- Defined in `apps/api/src/server.ts`

### `WEB_ORIGIN`

- Purpose: additional comma-separated origins allowed by CORS
- Default behavior: only local Vite origins are pre-allowed
- Defined in `apps/api/src/plugins/cors.ts`

Default built-in origins:

- `http://localhost:5173`
- `http://127.0.0.1:5173`

Example:

```bash
PORT=3001
WEB_ORIGIN=http://localhost:5177,https://mygobti.example.com
```

## Root Dev Helper Environment

The root `npm run dev` helper in `scripts/dev.mjs` uses a few extra variables for local orchestration.

### `VITE_API_PROXY_TARGET`

- Purpose: requested API target for Vite dev proxy and root dev orchestration
- Default: `http://127.0.0.1:3001`
- Behavior:
  - if local, the root helper may reuse an already healthy API or start `apps/api`
  - if local but occupied by an unhealthy process, the helper may move to the next free local port
  - if non-local, the helper treats the API as external and does not start `apps/api`

### `MYGOBTI_API_HEALTH_URL`

- Purpose: override the health-check URL used by root `npm run dev`
- Default: derived from the selected API origin plus `/api/health`

### `MYGOBTI_API_START_TIMEOUT_MS`

- Purpose: how long root `npm run dev` waits for a spawned local API to become healthy
- Default: `30000`

### `MYGOBTI_API_POLL_INTERVAL_MS`

- Purpose: polling interval for API health checks during local startup
- Default: `300`

### `MYGOBTI_API_PORT_SCAN_LIMIT`

- Purpose: maximum number of sequential local ports to probe when the requested API port is unavailable
- Default: `10`

Example:

```bash
VITE_API_PROXY_TARGET=http://127.0.0.1:3001 \
MYGOBTI_API_START_TIMEOUT_MS=45000 \
npm run dev
```

## Backup Utility Environment

`npm run backup:snapshot` supports one optional environment override:

### `MYGOBTI_BACKUP_ROOT`

- Purpose: default root directory for snapshot output when `--dest` is not provided
- Default: `$HOME/git-backups/MYGObti`

## Content and Runtime Assumptions

- Canonical source file: `questionedit/questionnewV2.md`
- API snapshot builder: `apps/api/src/services/canonicalContent.ts`
- Runtime web model builder: `apps/web/src/entities/quiz/model/runtimeQuiz.ts`
- Shared type and scoring contract: `packages/quiz-core/src`

There is no separate runtime config for:

- database connections
- secrets managers
- background jobs
- file storage
- feature flag services

## Workspace Script Surface

Root script entrypoints are defined in `/package.json`:

- `npm run dev`
- `npm run dev:web`
- `npm run dev:api`
- `npm run build`
- `npm run build:web`
- `npm run preview:web`
- `npm run typecheck`
- `npm run typecheck:web`
- `npm run typecheck:api`
- `npm run typecheck:core`

Workspace-local scripts:

- `apps/web`: `dev`, `build`, `preview`, `typecheck`, `test`, `test:watch`
- `apps/api`: `dev`, `start`, `build`, `typecheck`
- `packages/quiz-core`: `typecheck`

## UI-Refinement Notes

For UI work, the main configuration levers are:

- web dev server port
- API proxy target
- optional `?start=1` query trigger in the frontend home route
- preview routes:
  - `/preview/chat-atoms`
  - `/preview/results`

Those preview routes are development surfaces only; they do not alter production runtime configuration.
