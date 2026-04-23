<!-- generated-by: gsd-doc-writer -->
# Testing

## Current Test Strategy

This repository currently relies on a mix of:

- frontend Vitest tests in `apps/web`
- workspace typechecking
- production build validation

There are no dedicated API unit tests or end-to-end browser tests checked in at the moment.

## Commands

### Root-Level Checks

```bash
npm run typecheck
npm run build
```

What these cover:

- root `typecheck`: runs workspace typechecks where scripts exist
- root `build`: builds web, then typechecks API and `quiz-core`

### Frontend Unit Tests

```bash
npm run test --workspace apps/web
```

Watch mode:

```bash
npm run test:watch --workspace apps/web
```

### Focused Frontend Validation

```bash
npm run typecheck --workspace apps/web
npm run build --workspace apps/web
```

### API and Core Type Safety

```bash
npm run typecheck --workspace apps/api
npm run typecheck --workspace @mygobti/quiz-core
```

## Existing Automated Test Coverage

Current checked-in frontend tests cover:

- `apps/web/src/features/quiz-chat/model/chatScene.test.ts`
  - answered history rendering
  - revision hint behavior
  - pending send animation state
- `apps/web/src/features/band-story/lib/normalizeBandStoryData.test.ts`
  - story normalization shape
- `apps/web/src/features/band-story/ui/BandStoryPage.test.tsx`
  - chapter selection and query handling
- `apps/web/src/entities/character/model/characterAssets.test.ts`
  - asset manifest coverage and legacy id normalization
- `apps/web/src/pages/preview/resultPreviewModel.test.ts`
  - public and hidden result preview modeling

## What Is Not Covered Yet

- no API route tests for `apps/api`
- no direct unit tests in `packages/quiz-core`
- no Playwright/Cypress-style end-to-end flow
- no screenshot regression suite for UI polish

Because of that, UI changes should still be checked manually in the browser, especially around:

- home page CTA focus
- chat answering flow progression
- result-page share/export actions
- preview routes

## Recommended Validation Before Shipping UI Changes

For the upcoming UI refinement pass, run at minimum:

```bash
npm run test --workspace apps/web
npm run build --workspace apps/web
npm run typecheck --workspace apps/api
npm run typecheck --workspace @mygobti/quiz-core
```

Then manually verify:

1. `/` home flow
2. start test -> finish test path
3. `/preview/results`
4. poster save/share fallbacks
5. API health and quiz content loading

## Manual Runtime Checks

Suggested quick checks:

```bash
curl --noproxy '*' http://127.0.0.1:3001/api/health
curl --noproxy '*' http://127.0.0.1:3001/api/quiz/meta
```

If local ports differ, replace the port accordingly.

## When To Add More Tests

Consider extending test coverage if you touch:

- `packages/quiz-core/src/match.ts`
- runtime content parsing in `apps/api/src/services/canonicalContent.ts`
- route-level behavior in `apps/web/src/app/App.tsx`
- result poster generation or share fallback logic

Those areas affect either quiz correctness or the main product path.
