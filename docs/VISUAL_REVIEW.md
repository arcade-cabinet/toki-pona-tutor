---
title: Visual Review
updated: 2026-04-23
status: current
domain: quality
---

# Visual Review

Passing tests do not prove the game looks finished. This checklist is the manual
visual acceptance layer for UI, maps, and screenshots.

## Surfaces To Review

-   title screen
-   starter ceremony dialog
-   field HUD and contextual hint
-   pause overlay routes
-   wild battle UI
-   lead action-battle movebar
-   loading and defeat overlays
-   all seven authored map canvases
-   golden-path screenshots and diagnostics

## Map Checklist

For every authored map, check:

-   road/path language is obvious
-   blockers read as blockers
-   encounter grass/zone reads as encounter terrain
-   transitions face the correct direction
-   no rectangular non-transparent overlay artifacts
-   no actor or NPC stands on trees, walls, or blocked terrain
-   multi-tile objects are placed as whole footprints
-   the camera framing still leaves touch space around important interactions

## UI Checklist

Check that:

-   the overlay and the canvas feel like one product
-   the HUD frames the play area instead of crushing it
-   text is readable at mobile size
-   touch targets look and feel intentionally large enough
-   color and material choices stay within the brand system
-   no default RPG.js/RPG Maker-style chrome has leaked back in

## Current Known Gaps

-   Several routes are still too sparse and need stronger landmarking.
-   Some terrain transitions and biome seams need a deeper composition pass.
-   The maps are playable but still read closer to a strong prototype than a fully
    finished 16-bit adventure in some screenshots.
-   Android emulator smoke is proven locally; broader real-device visual review is
    still thin.

## Required Artifacts

-   `tests/e2e/full/visual-audit.spec.ts` outputs
-   `tests/e2e/full/journey-golden-path.spec.ts` PNG/JSON/Markdown diagnostics
-   curated screenshots under `docs/screenshots/visual-audit/`

If a visual change is intentional, refresh the curated screenshots in the same
PR that makes the change.
