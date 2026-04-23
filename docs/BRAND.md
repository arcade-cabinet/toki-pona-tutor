---
title: Brand
updated: 2026-04-22
status: current
domain: design
---

# Brand

Rivers Reckoning is a premium warm-fantasy field adventure. The target is not RPG Maker nostalgia, Flash-app chrome, dashboard UI, cyberpunk neon, or generic shadcn defaults. The UI should feel like an illustrated field kit Rivers carries through a monster-filled world.

## Identity

- **Name:** Rivers Reckoning.
- **Tone:** brave, curious, cozy-fantasy, investigation-forward.
- **Audience:** kids and families. Fierce creatures are fine; gore and cruelty are not.
- **Promise:** explore, catch monsters, gather clues, help people, solve the green-dragon mystery.
- **Visual north star:** premium 16-bit adventure book, with polished modern chrome around the canvas.

## Ownership Rule

RPG.js owns engine/runtime behavior. `rr-ui` owns every player-visible overlay.

- RPG.js and CanvasEngine may open/close GUI lifecycles, block player input, and complete dialog/menu promises.
- `.ce` files under `src/config/` are bridge adapters, not product chrome.
- React renders title, dialog, HUD, pause, combat command surfaces, loading, defeat, notifications, save/load, and credits.
- Product UI and browser tests must not depend on `.rpg-ui-*` selectors.
- Runtime styling lives in `src/ui/styles/rr-tokens.css`, `src/ui/styles/rr-effects.css`, and `src/ui/styles/rr-ui.css`.

## Fantasy Field Kit

The UI language is carved vellum, brass edges, river marks, field-journal type, and restrained cinematic movement.

Core traits:

- Vellum/parchment panels with subtle paper grain.
- Ink-forward text with high contrast and generous mobile sizing.
- River blue for travel, discovery, and focus.
- Forest green for primary action, health, and confirmation.
- Brass/gold for edges, rewards, and completion.
- Umber for physical depth and grounded shadows.
- Danger red only for damage, defeat, or irreversible actions.
- Ice only for cold-biome feedback and status context.

## Tokens

Canonical tokens use the `--rr-*` namespace:

| Token | Use |
| --- | --- |
| `--rr-vellum` | brightest paper wash |
| `--rr-parchment` | panel body |
| `--rr-ink` | primary text |
| `--rr-river` | travel/focus accent |
| `--rr-forest` | primary action/health |
| `--rr-brass` | carved panel border |
| `--rr-gold` | reward/completion |
| `--rr-umber` | earth/shadow accent |
| `--rr-danger` | damage/failure |
| `--rr-ice` | cold/status accent |

Legacy `--poki-*` aliases may exist only to keep older map/combat helpers working. New UI code references `--rr-*`.

## Typography

- Display/title: self-hosted `Fraunces Variable`, used for the game title, major headings, and field-kit labels.
- Body/UI: self-hosted `Nunito`, used for readable mobile interaction text.
- Mono/debug: self-hosted `JetBrains Mono`, used only for diagnostics, IDs, counts, and technical dumps.
- Runtime fonts must be local assets or bundled package assets. No CDN font dependency.

## SVG Language

Owned SVG primitives live in `src/ui/icons.tsx`.

- `RiverKnotIcon`: brand mark and title/command flourish.
- `CompassRoseIcon`: pause/menu/travel/loading.
- `ClueMarkIcon`: clue journal, notifications, discovery.
- `RouteIcon`: semantic route/action glyphs for `talk`, `battle`, `travel`, and `search`.
- `PanelCornerSvg`: carved panel corner lines.
- `RiversSvgFilters`: paper grain and ink bleed filters.

Icons must be simple enough to read at 24 px and strong enough to anchor large panels.

## UI Chrome

The HUD must frame gameplay without blocking tap targets.

- 44 px minimum interactive target for touch paths.
- Safe-area-aware placement.
- Stable `data-testid` selectors.
- HUD status and hints hidden during blocking dialog/title/pause/loading/defeat.
- Contextual hint appears near the player and uses semantic labels: `talk`, `battle`, `travel`, `search`.
- Blocking surfaces should read as one coordinated kit, not as separate components pasted together.

## Dialog And Text

Dialog is authored directly in English. Prefer short beats that advance character, clue, quest, or navigation state. Longer prose belongs in story docs, not modal UI.

Choice labels should be plain English verbs/nouns unless a system has a strong in-world name. Avoid internal IDs in player-facing copy.

## Clue Journal

The clue journal is an investigation system, not a language-learning surface.

- Clues are authored in `src/content/clues.json`.
- Dialog beats may award clue sightings through their `glyph` token.
- Quests, trainers, starter selection, encounters, and the green dragon can award clue IDs.
- Export copy says "Clue Journal" and uses the Rivers Reckoning filename.
- Legacy module/file names such as `vocabulary-screen.ts` and `dictionary-export.ts` are compatibility debt. Product copy must say clues.

## Visual Acceptance

Before accepting UI or tile changes:

1. Run the headed visual audit.
2. Inspect screenshots under `test-results/`.
3. Compare curated screenshots under `docs/screenshots/visual-audit/`.
4. Check wrong-way-facing tiles, rectangular non-transparent overlays, objects split from multi-tile groups, actors on blockers, and HUD overlap.
5. Confirm title, dialog, HUD, pause, combat, loading, defeat, and notifications feel like one product.

The acceptance bar is not only "tests passed." A human should look at the screenshots and believe this is a coherent polished game.
