<!-- generated-by: gsd-doc-writer -->
# Development

## Current Working Model

Development in this repo is centered on a narrow loop:

1. canonical quiz content lives in `questionedit/questionnewV2.md`
2. `apps/api` parses and serves that content
3. `apps/web` fetches the runtime snapshot and renders the quiz flow
4. `packages/quiz-core` provides shared types and scoring logic

For UI refinement, the important constraint is that frontend polish should not fork the runtime truth away from the API and `quiz-core`.

## Repository Structure

- `apps/web`
  - React 19 + Vite frontend
  - routes, shell, quiz flow, previews, poster export
- `apps/api`
  - Fastify read-only content service
  - health and quiz endpoints
- `packages/quiz-core`
  - shared quiz contracts, vector math, ranking logic
- `questionedit`
  - canonical question source, candidate versions, reports, scripts
- `frontend-design`
  - design experiments and imported references, not runtime source
- `docs`
  - repo docs and operating context
- `.planning`
  - GSD workflow state and execution artifacts

## Frontend Development Notes

The frontend entrypoint is `apps/web/src/main.tsx`, which mounts `App` under `BrowserRouter`.

The main route table is in `apps/web/src/app/App.tsx`:

- `/` uses the quiz shell and home flow
- `/band-story/*` mounts the auxiliary Band Story page
- `/preview/chat-atoms` and `/preview/results` exist for development QA

Key frontend areas:

- `src/pages/home`
  - home hero, answering stage, result stage
- `src/features/quiz-chat`
  - chat-style answering flow and scene model
- `src/features/share`
  - poster export and share handling
- `src/features/band-story`
  - side surface with separate story-oriented UI
- `src/entities/quiz`
  - API fetch helpers and runtime content assembly
- `src/entities/character`
  - avatar/live2d asset resolution and profile shaping
- `src/shared/ui`
  - reusable dialogue/story presentation primitives

## API Development Notes

The API entrypoint is `apps/api/src/server.ts`.

Important API modules:

- `src/routes/health.ts`
  - `GET /api/health`
- `src/routes/quiz.ts`
  - `GET /api/quiz/meta`
  - `GET /api/quiz/content`
- `src/services/canonicalContent.ts`
  - parses `questionedit/questionnewV2.md`
  - caches by source file `mtime`
- `src/plugins/cors.ts`
  - allows GET/HEAD from local web origins plus `WEB_ORIGIN`

The API is intentionally read-only. There are no write routes.

## Shared Core Development Notes

`packages/quiz-core` is the contract layer between web and API.

Current exported areas:

- quiz types and response interfaces
- cosine similarity helper
- quiz result evaluation and tie-break logic

If you change quiz result rules, update `packages/quiz-core` first and then update consumers in both `apps/web` and `apps/api`.

## Typical Change Patterns

### UI-only refinement

Touch mostly:

- `apps/web/src/pages/home/**`
- `apps/web/src/features/quiz-chat/**`
- `apps/web/src/features/share/**`
- `apps/web/src/app/styles.css`

Validate with:

- `npm run test --workspace apps/web`
- `npm run build --workspace apps/web`

### Runtime content loading changes

Touch:

- `apps/web/src/entities/quiz/**`
- `apps/api/src/routes/quiz.ts`
- `apps/api/src/services/canonicalContent.ts`
- `packages/quiz-core/src/quiz.ts`

Validate with:

- `npm run typecheck`
- `npm run build`

### Matching-rule changes

Touch:

- `packages/quiz-core/src/match.ts`
- optionally `questionedit/questionnewV2.md`
- any UI copy that explains results

Validate with:

- `npm run typecheck`
- `npm run build`
- relevant frontend tests that depend on the score model

## Documentation Sync Rules

When repo boundaries change, keep these files aligned:

- `README.md`
- `docs/ARCHITECTURE.md`
- `docs/CONFIGURATION.md`
- `docs/GETTING-STARTED.md`
- `docs/TESTING.md`

For major workflow or roadmap context, `.planning/PROJECT.md` and `.planning/STATE.md` may also need updates.

## Current Constraints

- No database
- No auth
- No CMS
- No server-side scoring endpoint
- No deployment config checked into this repo at the moment

That means most active work is either:

- frontend behavior and UI refinement
- content parsing and runtime contract maintenance
- quiz-core scoring logic

## Development Tips For Upcoming UI Polish

- Use `/preview/chat-atoms` for isolated message atom checks.
- Use `/preview/results` for result-state QA without replaying the quiz.
- Keep the main user path legible: start test -> answer -> result -> share.
- Avoid adding new primary navigation that competes with the quiz flow unless product intent changes.
