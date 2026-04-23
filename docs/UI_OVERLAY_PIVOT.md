---
title: UI Overlay Pivot Status
updated: 2026-04-23
status: draft
domain: design
---

# UI Overlay Pivot Status

This document records the unmerged UI rewrite work on branch `codex/rivers-reckoning-pivot`.

## What This Branch Actually Contains

This branch does **not** contain a SolidJS HUD implementation.

The implemented UI spike on this branch is:

- React 19
- `react-dom`
- Radix UI primitives
- Motion
- a custom Rivers Reckoning overlay mounted beside the RPG.js runtime

Evidence in branch code:

- `package.json` adds `react`, `react-dom`, `radix-ui`, and `motion`
- `src/ui/mount.tsx` mounts the overlay via `react-dom/client`
- `src/ui/RiversUiApp.tsx` is the root overlay app
- `src/ui/styles/rr-tokens.css`, `rr-effects.css`, and `rr-ui.css` define the visual system

## Major Surfaces On This Branch

- Landing/title presentation updates through `index.html`, `src/standalone.ts`, and `src/styles/*`
- React overlay shell under `src/ui/`
- Bridge/mount wiring for overlay ownership of player-facing surfaces
- Expanded brand/font/tokens work
- Additional HUD, pause, combat, and notification presentation experiments
- Supporting docs, screenshots, visual-audit artifacts, and tests for the spike

## Status

This branch is an **archival spike**, not accepted shipped state.

Reasons it is not current `main`:

- it is a very large mixed branch that combines UI rewrite, content, map, workflow, and docs changes
- its player-facing UI direction diverges from the current shipped branch history
- the implementation is React-based, so it does not satisfy a hypothetical SolidJS preservation goal
- it has not been decomposed into reviewable slices suitable for clean merge

## What To Reuse Later

If the project resumes the premium HUD/landing-page rewrite, the highest-value artifacts to mine from this branch are:

- `src/ui/bridge.ts`
- `src/ui/RiversUiApp.tsx`
- `src/ui/icons.tsx`
- `src/ui/styles/rr-tokens.css`
- `src/ui/styles/rr-effects.css`
- `src/ui/styles/rr-ui.css`
- `src/styles/brand.css`
- `src/styles/fonts.css`
- `docs/BRAND.md`
- `docs/UX.md`
- `docs/screenshots/visual-audit/*`

## Preservation Intent

This branch should remain pushed remotely and represented by a draft PR so the work is not lost.

Before any future merge attempt, the branch should be decomposed into at least these tracks:

1. landing page and brand system
2. runtime UI bridge and overlay mount
3. HUD/pause/combat surfaces
4. tests and screenshots
5. unrelated content/map/workflow changes split away from the UI rewrite
