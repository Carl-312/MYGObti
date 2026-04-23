<!-- generated-by: gsd-doc-writer -->
# apps/api

## Purpose

`apps/api` is a small Fastify service that exposes the canonical quiz content as read-only HTTP endpoints.

It owns:

- health reporting
- canonical markdown parsing
- in-memory cache keyed by source file modification time
- JSON responses consumed by `apps/web`

It does not own authentication, persistence, or write APIs.

## Commands

From the repository root:

```bash
npm run dev:api
npm run typecheck --workspace apps/api
```

Direct workspace commands:

```bash
npm run dev --workspace apps/api
npm run start --workspace apps/api
npm run build --workspace apps/api
```

## Endpoints

- `GET /api/health`
- `GET /api/quiz/meta`
- `GET /api/quiz/content`

## Main Files

- `src/server.ts`
  - creates the Fastify server
  - preloads canonical content
  - listens on `PORT` or `3001`
- `src/routes/health.ts`
  - health contract
- `src/routes/quiz.ts`
  - quiz metadata and content snapshot contracts
- `src/services/canonicalContent.ts`
  - parses `questionedit/questionnewV2.md`
  - builds question and character snapshots
- `src/plugins/cors.ts`
  - GET/HEAD-only CORS policy for local web origins and `WEB_ORIGIN`

## Canonical Source

The service reads:

- `questionedit/questionnewV2.md`

The response includes:

- version
- source path
- quiz metadata
- questions
- canonical character content
- counts

## Environment

- `PORT`
  - listen port
  - default: `3001`
- `WEB_ORIGIN`
  - additional allowed CORS origins, comma-separated

## Current Constraints

- no database
- no session handling
- no write endpoints
- no background workers
- no API test suite in this workspace yet

This package is intentionally small and file-driven.
