---
name: frontend-skill
description: Project-local frontend guidance for GSD agents. Apply this when the phase includes pages, components, styles, layout, interaction, or visual polish.
---

# MyGObti Frontend Skill

Use this skill only when the current GSD task includes frontend implementation or UI planning.
If the task is backend, docs-only, data, or infrastructure, ignore this skill.

## Intent

For MyGObti frontend work, avoid generic placeholder UI. Build interfaces that feel deliberate, clean, and study-focused.

## Visual Direction

- Favor strong hierarchy over many components.
- Prefer calm layouts with one dominant idea per section.
- Avoid dashboard-card mosaics unless cards are the interaction itself.
- Keep copy short, functional, and product-facing.
- Use spacing, contrast, typography, and alignment before adding visual chrome.
- Preserve responsiveness from the first pass, especially mobile question flow.

## Product UI Rules

- Optimize for readability, decision speed, and flow continuity.
- Headings should explain the current task or content, not market the product.
- Use utility copy for states, progress, hints, and actions.
- Reduce clutter around quiz content; the question and answer actions should stay primary.
- Motion should support hierarchy or feedback, not decoration.

## Avoid

- Generic SaaS hero patterns inside app screens
- Nested card stacks for ordinary content
- Multiple accent colors without a system reason
- Long explanatory paragraphs where labels or short helper text are enough
- Busy backgrounds that compete with quiz content

## Implementation Checklist

- Check the phase context and existing app structure before changing visuals.
- Keep desktop and mobile layouts both usable.
- Reuse existing patterns when the repo already establishes them.
- If introducing new visual language, define it consistently in the touched area.
- When styling a new screen, ensure the first screen clearly communicates the primary action.

## Frontend Planning Hint

If you are a GSD planner, executor, UI researcher, or UI checker working on a frontend-heavy phase, follow the spirit of the local frontend guidance above and apply it explicitly in plans, UI-SPEC output, implementation decisions, and review feedback.
