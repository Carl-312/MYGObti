<!-- generated-by: gsd-doc-writer -->
# packages/quiz-core

## Purpose

`@mygobti/quiz-core` is the shared contract and scoring package used by both `apps/web` and `apps/api`.

It keeps quiz logic out of app-specific layers so the frontend and API can agree on:

- quiz types
- content response shapes
- vector math
- result ranking and tie-break behavior

## Exports

`src/index.ts` re-exports:

- `./quiz`
- `./cosineSimilarity`
- `./match`

## Main Modules

- `src/quiz.ts`
  - axis definitions
  - question, answer, character, and API response types
- `src/cosineSimilarity.ts`
  - vector similarity helper
- `src/match.ts`
  - vector construction
  - latent score calculation
  - public ranking
  - tie-break handling
  - hidden match signal generation

## Consumers

- `apps/api`
  - uses the shared types for quiz snapshot shaping
- `apps/web`
  - uses `evaluateQuizResult`
  - uses shared question and metadata types

## Commands

From the repository root:

```bash
npm run typecheck --workspace @mygobti/quiz-core
```

## Current Notes

- This workspace currently exposes TypeScript source directly through the package export map.
- There is no separate build script; the current validation surface is typechecking.
- There are no dedicated unit tests in this workspace yet.

If result calculation changes, update this package before adjusting app-level UI copy or API response docs.
