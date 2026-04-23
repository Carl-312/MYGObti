<!-- generated-by: gsd-doc-writer -->
# Getting Started

## What You Are Starting

`MYGObti` is a workspace-based quiz app with three runtime parts:

- `apps/web`: React + Vite frontend
- `apps/api`: Fastify read-only content API
- `packages/quiz-core`: shared quiz types and matching logic

The current canonical quiz source is `questionedit/questionnewV2.md` (`V2.1D`).

## Prerequisites

- Node.js and npm available locally
- A shell that can run workspace scripts from the repo root

The repository already includes `package-lock.json`, so `npm` is the expected package manager in current docs and scripts.

## Install Dependencies

From the repository root:

```bash
npm install
```

## Start Local Development

Recommended split startup:

```bash
npm run dev:api
```

In another terminal:

```bash
npm run dev:web
```

You can also start the frontend only:

```bash
npm run dev
```

But the app needs the API to serve quiz metadata and content.

## Default Local Addresses

With default config:

- API: `http://127.0.0.1:3001`
- Web: Vite default is `http://127.0.0.1:5173`

If those ports are already occupied, Vite may move to another free port. The API can also be moved with `PORT=...`.

## Sanity Checks

Check API health:

```bash
curl --noproxy '*' http://127.0.0.1:3001/api/health
```

Expected response shape:

```json
{
  "ok": true,
  "service": "mygobti-api",
  "version": "V2.1D",
  "sourcePath": "questionedit/questionnewV2.md"
}
```

Then open the frontend in the browser and verify the home page loads.

## Main Routes

User-facing and development routes currently registered in `apps/web/src/app/App.tsx`:

- `/`: quiz home and main flow
- `/band-story/*`: auxiliary Band Story surface
- `/preview/chat-atoms`: dev-only UI atom preview page
- `/preview/results`: dev-only result QA page

## Recommended First Checks Before UI Work

1. Confirm the API is returning the expected quiz version.
2. Confirm the home route can enter the quiz flow.
3. Confirm the result preview route renders.
4. Confirm the frontend can export or simulate share flow without runtime errors.

## Common Problems

### Frontend says content loading failed

Check:

- `apps/api` is running
- `VITE_API_BASE_URL` points to the correct API prefix
- `VITE_API_PROXY_TARGET` points to the correct local API during Vite dev

### API port is already in use

Run the API on another port:

```bash
PORT=3002 npm run dev:api
```

Then point the frontend proxy at it:

```bash
VITE_API_PROXY_TARGET=http://127.0.0.1:3002 npm run dev:web
```

### CORS blocks non-default local origins

Set `WEB_ORIGIN` for the API process:

```bash
WEB_ORIGIN=http://localhost:5177 npm run dev:api
```

## Useful Follow-Up Commands

```bash
npm run typecheck
npm run build
npm run test --workspace apps/web
```

For architecture context before making larger changes, read `README.md` and `docs/ARCHITECTURE.md`.
