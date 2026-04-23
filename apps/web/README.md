<!-- generated-by: gsd-doc-writer -->
# apps/web

## Purpose

`apps/web` is the React + Vite frontend for the MyGObti quiz experience.

It owns:

- the home/start experience
- the quiz answering flow
- the result page
- poster export and share actions
- development preview pages

It does not own canonical quiz truth. Runtime content is fetched from `apps/api`.

## Commands

From the repository root:

```bash
npm run dev:web
npm run build --workspace apps/web
npm run test --workspace apps/web
npm run typecheck --workspace apps/web
```

## Runtime Dependencies

- React 19
- React Router
- Vite
- `@mygobti/quiz-core`
- `html-to-image`
- `motion`

## Main Entry Files

- `src/main.tsx`: mounts the app under `BrowserRouter`
- `src/app/App.tsx`: route table and top-level quiz state handling
- `src/app/styles.css`: main global styling surface

## Routes

- `/`: main quiz flow
- `/band-story/*`: auxiliary story route
- `/preview/chat-atoms`: chat atom preview
- `/preview/results`: result QA preview

## Important Directories

- `src/pages/home`
  - home hero, answer stage, result stage
- `src/pages/preview`
  - development-only preview surfaces
- `src/features/quiz-chat`
  - chat-based quiz UI and scene model
- `src/features/share`
  - poster export and share helpers
- `src/features/band-story`
  - side reading surface
- `src/entities/quiz`
  - API client and runtime content assembly
- `src/entities/character`
  - character assets and UI wrappers
- `src/shared/ui`
  - reusable dialogue/story design primitives

## Environment

Supported frontend variables:

- `VITE_API_BASE_URL`
- `VITE_API_PROXY_TARGET`

Defaults are documented in `docs/CONFIGURATION.md`.

## Testing

Current tests live in:

- `src/features/quiz-chat/model/chatScene.test.ts`
- `src/features/band-story/**`
- `src/entities/character/model/characterAssets.test.ts`
- `src/pages/preview/resultPreviewModel.test.ts`

For UI refinement, run tests plus a local browser check on `/` and `/preview/results`.
