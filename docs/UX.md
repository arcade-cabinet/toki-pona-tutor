---
title: UX Architecture
updated: 2026-04-20
status: current
domain: product
---

# poki soweli — UX Architecture

Single source of truth for how the player interacts with the game. Every HUD component, every input affordance, every on-screen overlay follows this doc. If an implementation disagrees with this doc, either the implementation is wrong or this doc is wrong and must land an update first.

## Framework — all RPG.js-native, no bolt-ons

- **GUI** is RPG.js's unified GUI system. All custom components are `.ce` files (CanvasEngine). No SolidJS, no React, no Vue. Components register via `defineModule<RpgClient>({ gui: [...] })`.
- **Styling** is `@rpgjs/ui-css` tokens overridden by `src/styles/brand.css` (BRAND.md §Palette + §Typography + §Spacing). No framework CSS.
- **Reactivity** is CanvasEngine signals — `engine.sceneMap.players`, `engine.scene.currentPlayer`, etc. Signal-driven auto-updates are how components stay in sync with game state.
- **Built-in components first.** Use RPG.js's `HudComponent`, built-in dialog GUI, and CanvasEngine presets (`Bar`, `Loading`, `NineSliceSprite`) before authoring anything custom. Only author a `.ce` when RPG.js doesn't already ship the affordance.
- **Built-in `rpg-dialog`** renders `player.showText` + `player.showChoices`. We style it via `brand.css` overrides. If those overrides are insufficient, replace the dialog component by registering a custom `.ce` with `id: 'rpg-dialog'`.

## Mobile-first, no fixed layout

- **Every on-screen element is a tap/click target.** Keyboard works on desktop as a convenience shortcut to the same actions; it is never the only way to do something.
- **No pixel-fixed widths.** Layout uses CSS grid / flex with the BRAND.md `--space-*` scale, `vmin`-relative units, `clamp()` for font sizes, and container queries for breakpoint adaptation.
- **Safe-area-aware.** The HUD uses `env(safe-area-inset-*)` for phone notches, home indicators, and tablet bezels.
- **Touch targets** meet a 44 CSS-pixel minimum on any device where `pointer: coarse`. This is enforced by a CSS audit pass (see ROADMAP T5-08), not hand-measured.
- **Responsive orientation.** Portrait and landscape both play; no orientation lock. The HUD layout reflows; the canvas scales to fit.

## Input model

### Tap-to-walk is primary

The player taps a tile on the map; the engine pathfinds the lead creature there one step at a time (4-way grid, N/S/E/W only — diagonals are not part of this game's movement). Canvas pointer events route through RPG.js's input system — same bus keyboard feeds.

- Tapping a **walkable tile**: walk there.
- Tapping a **non-walkable tile** in direct line of sight: walk to the adjacent walkable tile closest to the tap.
- Tapping an **interactable** (NPC, warp, tall-grass edge, chest, jan-lawa): walk adjacent + auto-interact. No separate action button.
- Tapping **the player sprite itself** or the **contextual hint glyph** (see §Contextual Hint): interact with whatever's adjacent right now.

### Keyboard (desktop convenience)

- Arrow keys / WASD: 4-way step movement.
- Space / Enter: interact with the current contextual target (same as tapping the hint glyph).
- Escape: open the hamburger menu.

Both input paths feed the same engine bus. Never author a keyboard-only action that has no tap equivalent.

### 4-way movement only

No diagonals. Grid-stepped. The old `src/modules/main/virtual-dpad.ts` with its "diagonal snap" math is retired — tap-to-walk replaces the virtual stick entirely.

## HUD layout

The HUD is DOM overlaid on the RPG.js canvas via CanvasEngine's `DOMContainer`. It has four responsive regions:

```text
┌───────────────────────────────────────────────────┐
│ ┌─[Status]──────────────┐          [≡ Menu]      │  ← top bar
│ │ [portrait] name       │                         │
│ │ HP ▓▓▓▓▓░░░ L5  toki:23│                         │
│ └───────────────────────┘                         │
│                                                   │
│                                                   │
│                                                   │
│                                                   │
│                                                   │
│                 (canvas world)                    │
│                                                   │
│                                                   │
│                                                   │
│      [hint glyph ◎]  ← follows player sprite      │
│                                                   │
└───────────────────────────────────────────────────┘
  [overlay: dialog / choice / party / settings / ...]
```

### 1. Top status strip — `hud-status.ce`

Pinned top-left, safe-area aware. Content, in priority order:

- **Lead creature portrait** (Fan-tasy faceset, 48×48 at desktop, scales with container).
- **Lead creature name** — sitelen-pona glyph of species id + TP name underneath (Inter body).
- **HP bar** — color via `src/styles/hp-bar.ts` threshold classes. `Bar` preset from CanvasEngine.
- **Level** — small tabular-num pill next to HP.
- **Mastered-words tally** — `toki: 23` — ambient reminder of the actual game goal.

Signal dependencies: `engine.scene.currentPlayer`, `mastered_words` count (read on map change + on catch).

Hidden while a dialog overlay is open.

### 2. Top-right hamburger — `hud-menu.ce`

Single tap target. Opens the **pause overlay** (see §Pause overlay). Replaces every pause-menu action. Players can always find the menu in the same spot.

Hidden while a dialog overlay is open (dialog already owns the screen).

### 3. Contextual hint — `hud-hint.ce` (attached-GUI)

When the player is adjacent to an interactable, a small TP glyph appears *near the player sprite* indicating what's there:

| TP word | When shown |
|---------|-----------|
| `toki` | adjacent to a talkable NPC |
| `tawa` | standing on a warp tile |
| `alasa` | adjacent to tall-grass edge |
| `poki` | inside an encounter pending a choice |
| `kama` | adjacent to a treasure chest |
| `utala` | challenged by a jan-lawa within sight |

Uses RPG.js `attachToSprite: true` so the glyph follows the player in world-space automatically. Tapping the glyph triggers the interaction; tapping the player sprite does too.

### 4. Pause overlay — `hud-menu-panel.ce`

Slide-in from right, summoned by the hamburger. Responsive: on phones it's a full-width sheet; on tablets/desktop it's a ~420px side panel with the world canvas still visible behind at reduced opacity.

Four routes:

| Glyph | Route | Shows |
|-------|-------|-------|
| sitelen `soweli` | **Party** | Up to 6 creatures: portrait + name + HP bar + level. Tap = detail. Drag (T2-12) = reorder lead. |
| sitelen `nasin` | **Vocab** | Mastered words + sightings count + sitelen-pona glyph (T8-03). |
| sitelen `ijo` | **Inventory** | Badges, journey-beat progress, items (poki/kili/ma). |
| sitelen `awen` | **Settings** | Existing `settings-screen.ts` content: sitelen / tenpo / wawa / kalama. |

Plus a small Save row at the bottom (`awen`) and a Quit-to-Title row.

Back-button / swipe-right / Escape / tap-outside all dismiss the panel.

## Dialogs and choices

Use RPG.js's built-in dialog GUI (`id: 'rpg-dialog'`). Trigger via `player.showText` / `player.showChoices` (server-side, already in use). Style via our `brand.css` (`--poki-*` tokens are already overriding `@rpgjs/ui-css`).

While a dialog is open:
- Top status strip + hamburger + hint glyph are hidden.
- Dialog fills bottom-third on phones; bottom-half on tablets/desktop.
- Choices are tappable rows; each row has `data-testid="choice-<index>"`.
- Tapping outside the dialog does nothing (must acknowledge explicitly).

If BRAND.md overrides prove insufficient (e.g. we want a multi-column choice layout, or a per-beat typewriter speed control integrated with the `tenpo` setting), replace the built-in dialog by registering a custom `.ce` with id `'rpg-dialog'`. Only then, not before.

## Testability — `data-testid` contract

Every HUD element the player can interact with carries a stable `data-testid`. E2E tests drive the HUD via `page.locator('[data-testid="..."]').click()`, same interaction a mobile player has. No keyboard simulation in E2E unless testing the desktop shortcut specifically.

Naming convention:

| Element | testid |
|---------|--------|
| Hamburger menu | `hud-menu-toggle` |
| Pause overlay root | `pause-overlay` |
| Pause route tabs | `pause-party`, `pause-vocab`, `pause-inventory`, `pause-settings` |
| Party slot N | `party-slot-{n}` |
| Contextual hint glyph | `hint-glyph` |
| Dialog choice N | `choice-{n}` |
| Dialog advance | `dialog-next` |
| Save slot N | `save-slot-{n}` |
| Close overlay | `overlay-close` |

## What this retires

- **`src/modules/main/virtual-dpad.ts`** — tap-to-walk replaces virtual-stick input. Module + its 20 unit tests removed in the HUD-landing PR.
- **Any mental model carrying over from v4's `@rpgjs/mobile-gui` plugin** — that plugin doesn't exist in v5, and our HUD doesn't mimic a Game Boy. No persistent A/B buttons. No bottom-centre d-pad. Interactions come to the player (contextual hint glyph), not the player to buttons.

## Non-goals

- No custom framework (Solid/React/Vue). CanvasEngine + RPG.js GUI is the framework.
- No `@rpgjs/mobile-gui` dependency (doesn't exist in v5; v4 version ties to nipplejs and DOM-only assumptions).
- No Game-Boy-style HUD with fixed directional + action buttons. Mobile games don't look like that anymore.
- No diagonals.
- No orientation lock.
- No fixed-pixel breakpoints.
