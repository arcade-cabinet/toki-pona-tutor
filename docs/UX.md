---
title: UX
updated: 2026-04-22
status: current
domain: design
---

# UX

Rivers Reckoning is mobile-first. Keyboard controls are desktop conveniences; mouse and tap must be enough to play the game.

## Runtime Surface

The runtime is split deliberately:

- RPG.js owns maps, events, combat hooks, input blocking, save hooks, and GUI open/close lifecycles.
- CanvasEngine `.ce` files under `src/config/` are thin adapters that publish state into `RiversUiBridge`.
- `src/ui/` is the player-facing React UI system.
- `#rpg` hosts the RPG.js canvas.
- `#rr-ui-root` hosts the React overlay.

Do not add new player-facing `.ce` chrome. If RPG.js needs a GUI, add or extend a bridge adapter and render the surface in `src/ui/`.

## Bridge Contract

`src/ui/bridge.ts` is the boundary between RPG.js and React.

Current bridge-owned surfaces:

- Title screen.
- Dialog and choices.
- HUD status.
- HUD menu button.
- Contextual hint.
- Pause overlay.
- Wild battle status.
- Lead movebar and bench switcher.
- Warp loading.
- Defeat/respawn.
- Notifications.

RPG.js callbacks must still complete correctly. For example, `showText`, `showChoices`, pause route selection, title selection, combat move use, and lead switching all resolve through bridge callbacks back into the existing GUI lifecycle.

## Selector Contract

Browser tests target owned selectors:

| Surface | Selector |
| --- | --- |
| UI root | `data-testid="rr-ui-root"` |
| Title title | `data-testid="rr-title-title"` |
| Title entries | `.rr-title-entry` |
| Dialog panel | `data-testid="rr-dialog"` |
| Dialog content | `data-testid="rr-dialog-content"` |
| Dialog choices | `data-testid="dialog-choice-{n}"` |
| HUD status | `data-testid="hud-status"` |
| HUD menu | `data-testid="hud-menu-toggle"` |
| Hint | `data-testid="hint-glyph"` |
| Pause overlay | `data-testid="pause-overlay"` |
| Pause title | `data-testid="rr-pause-title"` |
| Wild battle | `data-testid="wild-battle"` |
| Lead movebar | `data-testid="lead-movebar"` |
| Warp loading | `data-testid="warp-loading"` |
| Defeat screen | `data-testid="defeat-screen"` |

Product UI and E2E tests must not rely on `.rpg-ui-*` selectors.

## Mobile HUD Contract

The HUD frames gameplay instead of replacing it.

- Status strip shows lead creature, level, HP, and clue count.
- Contextual hint appears near the player when an adjacent/touch-reachable action exists.
- HUD menu opens the pause overlay.
- HUD and hint hide while blocking surfaces are visible.
- Touch targets are at least 44 px.
- Safe-area insets are respected.

The contextual hint values are semantic English tokens:

| Hint | Use |
| --- | --- |
| `talk` | adjacent NPC/sign interaction |
| `battle` | set-piece combat interaction |
| `travel` | warp/route movement |
| `search` | nearby encounter grass |

## Pause Overlay Routes

The pause overlay is the primary mobile command surface.

| Route | Purpose |
| --- | --- |
| Party | lead creature, bench creatures, detail cards, healing, promotion |
| Clues | clue sightings, field log, Field Notes micro-game, clue export |
| Gear | inventory, badges, active/completed quests |
| Bestiary | seen/caught creature catalog and description reread |
| Settings | glyph overlay, text speed, contrast, accessible mode, audio volume |
| Save | save slots and save metadata |
| Title | quit-to-title path |

Every route must be reachable by tap, and every action in a route must be represented by an E2E-addressable element or dialog choice.

## Input Model

Supported input paths:

- Tap/click a map tile to walk.
- Tap/click the player while adjacent to an interactable to trigger it.
- Tap/click the contextual hint.
- Tap/click HUD menu and pause route actions.
- Tap/click dialog and combat choices.
- Keyboard arrows/WASD and action/escape for desktop shortcut parity.

Locked warps and invalid taps should produce understandable feedback rather than silent failure.

## Touch Targets

Acceptance requirements:

- Primary buttons and choices are at least 44 px high.
- Combat move buttons are at least 56 px high when space allows.
- Touch controls avoid the exact tile the player is expected to tap.
- Safe-area insets are applied on top, right, bottom, and left.
- Mobile layout keeps critical choices above browser/OS gesture zones.

## Visual Diagnostics

`tests/e2e/full/visual-audit.spec.ts` captures:

- title choices
- starter map canvas
- mobile starter choices
- mobile pause overlay
- all seven authored map canvases

`tests/e2e/full/journey-golden-path.spec.ts` captures periodic PNG, JSON, and Markdown diagnostics across the playthrough. The dump includes map ID, player position, collision context, tile context, HUD/dialog visibility, camera scale, and visual-cohesion checklist items.

Any UI or map change should be reviewed against these artifacts before claiming the game remains visually correct.

## Current Known UX Limits

- Full browser coverage is local; CI only runs the smoke browser gate.
- Some route/action file names still use compatibility terms such as vocabulary/dictionary.
- The current maps are playable but still need denser composition, stronger landmarks, and more consistent tile transitions.
- Maestro flows exist for Android debug APK and iOS Pages smoke, but emulator/simulator execution remains release-QA work.
