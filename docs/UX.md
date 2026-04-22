---
title: UX Architecture
updated: 2026-04-22
status: current
domain: product
---

# poki soweli — UX Architecture

Single source of truth for how the player interacts with the game. Every HUD component, every input affordance, every on-screen overlay follows this doc. If an implementation disagrees with this doc, either the implementation is wrong or this doc is wrong and must land an update first.

## Framework — all RPG.js-native, no bolt-ons

-   **GUI** is RPG.js's unified GUI system. All custom components are `.ce` files (CanvasEngine). No SolidJS, no React, no Vue. Components register via `defineModule<RpgClient>({ gui: [...] })`.
-   **Styling** is `@rpgjs/ui-css` tokens overridden by `src/styles/brand.css` (BRAND.md §Palette + §Typography + §Spacing). No framework CSS.
-   **Reactivity** is CanvasEngine signals — `engine.sceneMap.players`, `engine.scene.currentPlayer`, etc. Signal-driven auto-updates are how components stay in sync with game state.
-   **Built-in components first.** Use RPG.js's `HudComponent`, built-in dialog GUI, and CanvasEngine presets (`Bar`, `Loading`, `NineSliceSprite`) before authoring anything custom. Only author a `.ce` when RPG.js doesn't already ship the affordance.
-   **Built-in `rpg-dialog`** renders `player.showText` + `player.showChoices`. We style it via `brand.css` overrides. If those overrides are insufficient, replace the dialog component by registering a custom `.ce` with `id: 'rpg-dialog'`.

## Mobile-first, no fixed layout

-   **Every on-screen element is a tap/click target.** Keyboard works on desktop as a convenience shortcut to the same actions; it is never the only way to do something.
-   **No pixel-fixed widths.** Layout uses CSS grid / flex with the BRAND.md `--space-*` scale, `vmin`-relative units, `clamp()` for font sizes, and container queries for breakpoint adaptation.
-   **Safe-area-aware.** The HUD uses `env(safe-area-inset-*)` for phone notches, home indicators, and tablet bezels.
-   **Touch targets** meet a 44 CSS-pixel minimum on any device where `pointer: coarse`. This is enforced by `tests/e2e/full/mobile-touch-targets.spec.ts` on an iPhone viewport, not hand-measured.
-   **Responsive orientation.** Portrait and landscape both play; no orientation lock. The HUD layout reflows; the canvas scales to fit.

## Input model

### Tap-to-walk is primary

The player taps a tile on the map; the engine pathfinds the lead creature there one step at a time (4-way grid, N/S/E/W only — diagonals are not part of this game's movement). Canvas pointer events route through RPG.js's input system — same bus keyboard feeds.

Current implementation note: `src/config/provide-tap-controls.ts` now snaps taps onto the configured 32px player movement grid, resolves Tiled object rectangles before falling back to scene events so invisible warp hitboxes still tap correctly, emits a server-authoritative tap-route request, and exact-lands on the destination tile before auto-interact. Bind retry cadence, snap retry cadence, and snap attempt limits are authored in `src/content/gameplay/ui.json`.

-   Tapping a **walkable tile**: walk there.
-   Tapping a **non-walkable tile** in direct line of sight: walk to the adjacent walkable tile closest to the tap.
-   Tapping an **interactable** (NPC, warp, tall-grass edge, chest, jan-lawa): walk adjacent + auto-interact. No separate action button.
-   Tapping **the player sprite itself** or the **contextual hint glyph** (see §Contextual Hint): interact with whatever's adjacent right now.

### Keyboard (desktop convenience)

-   Arrow keys / WASD: 4-way step movement.
-   Space / Enter: interact with the current contextual target (same as tapping the hint glyph).
-   Escape: open the hamburger menu.

Both input paths feed the same engine bus. Never author a keyboard-only action that has no tap equivalent.

### 4-way movement only

No diagonals. Grid-stepped. The old `src/modules/main/virtual-dpad.ts` with its "diagonal snap" math is retired — tap-to-walk replaces the virtual stick entirely.

### Map transitions

Every successful warp opens `poki-warp-loading`, a CanvasEngine GUI overlay
around the server-side `changeMap()` call. Phase labels, ARIA template, and the
default phase come from `src/content/gameplay/ui.json`; the destination label
comes from the runtime map label registry. The overlay is browser-only
best-effort; in Vitest integration fixtures it no-ops so engine transition tests
continue to assert the map change directly.

### Defeat transitions

When player HP reaches 0, `onDead` opens `poki-defeat-screen`, a full-screen
CanvasEngine GUI with `data-testid="defeat-screen"`. Phase labels, message copy,
ARIA template, revive dialog ID, and the default phase come from `src/content/gameplay/ui.json`;
the returning phase runs before the existing revive dialog and last-safe-village
respawn. The overlay is browser-only best-effort; in
Vitest integration fixtures it no-ops so respawn tests continue to drive the
engine directly.

## HUD layout

The HUD is DOM overlaid on the RPG.js canvas via CanvasEngine's `DOMContainer`. It frames the playfield without intercepting world taps, and every player action has a visible tap/click affordance before any keyboard shortcut is considered. It has four responsive regions:

```text
┌───────────────────────────────────────────────────┐
│╔═════════════════════════════════════════════════╗│  ← non-blocking frame
│║ ┌─[Status]──────────────┐        [≡ Menu]     ║│  ← top bar
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
│║ [combat: target pill + 2×2 move dock on phone] ║│
│╚═════════════════════════════════════════════════╝│
└───────────────────────────────────────────────────┘
  [overlay: dialog / choice / party / settings / ...]
```

### 1. Top status strip — `hud-status.ce`

Pinned top-left, safe-area aware. Content, in priority order:

-   **Lead creature portrait** (Fan-tasy faceset, 48×48 at desktop, scales with container).
-   **Lead creature name** — sitelen-pona glyph of species id + TP name underneath (Inter body).
-   **HP bar** — tier thresholds, TP labels, and colors come from `src/content/gameplay/visuals.json` through `src/styles/hp-bar.ts`. `Bar` preset from CanvasEngine.
-   **Level** — small tabular-num pill next to HP.
-   **Mastered-words tally** — `toki: 23` — ambient reminder of the actual game goal.

Signal dependencies: `engine.scene.currentPlayer`, `mastered_words` count (read on map change + on catch).

Current implementation note: the shipped strip reads the persisted lead creature species / level / mastered-word count and uses the live RPG.js player HP signal as the immediate bar source. Its level, HP, mastered-word label templates, and portrait fallback come from `src/content/gameplay/ui.json`. The Party panel now also persists `party_roster.current_hp` so selected creatures can be healed with inventory items and carry that HP through slot reordering.

Hidden while a dialog overlay is open.

### 2. Top-right hamburger — `hud-menu.ce`

Single tap target. Opens the **pause overlay** (see §Pause overlay). Replaces every pause-menu action. Players can always find the menu in the same spot. The same auto-displayed HUD layer renders the non-blocking `hud-frame` border around the gameplay area; it has `pointer-events: none` so map taps still reach tap-to-walk.

Hidden while a dialog overlay is open (dialog already owns the screen).

### 3. Contextual hint — `hud-hint.ce`

When the player is adjacent to an interactable, a small TP glyph appears _near the player sprite_ indicating what's there:

| TP word | When shown                            |
| ------- | ------------------------------------- |
| `toki`  | adjacent to a talkable NPC            |
| `tawa`  | standing on a warp tile               |
| `alasa` | adjacent to tall-grass edge           |
| `poki`  | inside an encounter pending a choice  |
| `kama`  | adjacent to a treasure chest          |
| `utala` | challenged by a jan-lawa within sight |

Current implementation note: the shipped glyph is a DOM HUD overlay that projects the current player position through the active viewport and repositions a fixed button near the sprite each refresh. Tapping the glyph triggers the interaction; tapping the player sprite does too.

### 4. Pause overlay — `hud-menu-panel.ce`

Slide-in from right, summoned by the hamburger. Responsive: on phones it's a full-width sheet; on tablets/desktop it's a ~420px side panel with the world canvas still visible behind at reduced opacity.

Four routes:

| Glyph            | Route         | Shows                                                                                                                                                                                                                                                                                 |
| ---------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| sitelen `soweli` | **Party**     | Up to 6 creatures: portrait + name + HP bar + level. Tap = detail. Detail card includes type, XP progress, known moves, `kili` healing when wounded, and a `lead` action that promotes that creature to slot 0.                                                                       |
| sitelen `nasin`  | **Vocab**     | Mastered words + sightings count + sitelen-pona glyph. Tap a word to open its glyph/word/sightings card; tap `lipu nasin` to reread the TP-only sentence log; tap `wan sitelen` for the pick-the-sentence micro-game; tap `lipu nimi` to export the mastered-word card as text + SVG. |
| sitelen `ijo`    | **Inventory** | Badges, journey-beat progress, items (poki/kili/ma), and active/completed side quests.                                                                                                                                                                                                |
| sitelen `lipu`   | **Bestiary**  | `lipu soweli` progress and per-species `jo` / `lukin` / `ala` rows, backed by SQLite seen/caught state.                                                                                                                                                                               |
| sitelen `awen`   | **Settings**  | Existing `settings-screen.ts` content: sitelen / tenpo / wawa / suli / kalama.                                                                                                                                                                                                        |

Plus a small Save row at the bottom (`awen`) and a Quit-to-Title row.

Back-button / swipe-right / Escape / tap-outside all dismiss the panel.

## Dialogs and choices

Use the app's registered dialog GUI (`id: 'rpg-dialog'`), which preserves RPG.js's built-in dialog DOM contract but now runs through a local `.ce` override so pointer/touch selection stays isolated from world interaction. Trigger via `player.showText` / `player.showChoices` (server-side, already in use). Style via our `brand.css` (`--poki-*` tokens are already overriding `@rpgjs/ui-css`). Dialog fallback text, default position, sitelen overlay selector, and choice SFX IDs are authored in `src/content/gameplay/ui.json`.

Wild encounter choices use this dialog layer directly. The current action contract is `utala / poki / ijo / tawa`: the prompt shows the target idle face when the species has sprite metadata, target name, level, HP, and the HP-tier word (`wawa` / `pakala` / `moli`); `utala` lowers target HP for catch odds, applies the lead-vs-target type matchup to damage, and shows `pona mute` / `awen` / `pakala` feedback before the updated HP text; `poki` consumes one `poki_lili` and runs the wild overlay through `poki li tawa` then `poki li awen` or `soweli li weka`; `ijo` opens a healing submenu for carried heal items such as `kili`; and `tawa` flees. Wild encounter dialog IDs, choice labels, result labels, and damage notification timing are authored in `src/content/gameplay/ui.json`. The jan Moku shop in `ma_telo` uses the same dialog choice contract: the prompt shows current `ma`, stock rows buy `poki_lili` / `kili`, and `tawa` exits the shop. Shop stock plus NPC graphic, intro dialog, delivery target, and reward-toast timing are authored in `src/content/gameplay/shops.json` and `ui.json`.

While a dialog is open:

-   Top status strip + hamburger + hint glyph are hidden.
-   Dialog fills bottom-third on phones; bottom-half on tablets/desktop.
-   Choices are tappable rows. The local `rpg-dialog.ce` exposes `.rpg-ui-dialog-choice[data-choice-index="<index>"]` and brand CSS gives every row a readable parchment button treatment with a 44 px coarse-pointer floor.
-   When Settings → `sitelen` is on, the dialog also renders `data-testid="dialog-sitelen-overlay"` with a glyph-only sitelen line derived from known TP words in the current message. Unknown/non-TP tokens are skipped so English fallback strings never become a second dictionary.
-   Tapping outside the dialog does nothing (must acknowledge explicitly).

If BRAND.md overrides prove insufficient beyond this thin compatibility override (e.g. multi-column choices), extend the local `.ce` dialog component rather than patching call sites. The current override already binds the `tenpo` text-speed setting to the RPG.js dialog typewriter path. `tests/e2e/full/mobile-hint.spec.ts` proves that stray canvas taps are ignored while the dialog is open, `tests/e2e/full/text-speed.spec.ts` proves instant plus nonzero typewriter behavior through the real Settings dialog, and `tests/e2e/full/visual-audit.spec.ts` emits starter-choice PNG artifacts to catch contrast/layout regressions.

## Testability — current selectors and target contract

Current implementation status:

-   The dialog GUI keeps the `data-choice-index="{n}"` contract; the existing-save confirm flow still uses that today.
-   The title shell now ships on RPG.js's `rpg-title-screen` GUI (`.rpg-ui-title-screen-title`, `.rpg-ui-menu-item`) with branded parchment/sky CSS, New / Continue / Settings / Quit rows, web quit-intent acknowledgement, and native Capacitor quit wiring. Title labels, continue-label formatting, new-game confirmation copy, starter prompt/dialog IDs, and quit fallback copy are authored in `src/content/gameplay/ui.json`. The local smoke and full-browser suites assert it directly.
-   The top-left status strip now ships on the custom `poki-hud-status` GUI with `data-testid="hud-status"`; `tests/e2e/full/mobile-status.spec.ts` proves it appears after starter selection on an iPhone viewport and hides while dialogs are open.
-   The pause overlay now ships on the custom `poki-pause-screen` GUI with `data-testid="pause-overlay"` at the root, HUD-native Party / Vocab / Inventory / Bestiary / Settings route tabs, route content panes, footer Resume / Save / Quit-to-title rows, and the finer-grained route testids below. HUD status/menu/hint labels and timing, pause route labels/default route, footer labels, detail row copy, party-panel HP/XP/move labels, bestiary row/meta/description-reread labels, settings summary formatting, inventory/vocabulary detail/card/sentence-log templates, save-slot labels/status copy/snap timing, and preview limits are authored in `src/content/gameplay/ui.json` and normalized through `src/content/gameplay/index.ts`. The same JSON file also owns quest journal/offer/reward copy and toast duration, dialog fallback/default/SFX copy, defeat/warp overlay ARIA/default phase copy, shop and wild-encounter choice/result copy, wild encounter dialog IDs, dictionary export text/SVG layout, lead move bar target/range/meta copy, and victory/item-drop/bench-switch notification templates/durations used by the tap/mouse interaction dialogs. The Vocab route renders mastered-word rows with sitelen glyph prefixes and sightings counts; tapping a row opens the glyph/word/sightings card, tapping `lipu nasin` opens the TP-only sentence log from SQLite, tapping `wan sitelen` opens a four-choice TP sentence micro-game from `src/content/gameplay/language.json`, and tapping `lipu nimi` emits the dictionary export payload to the browser runtime for Web Share, clipboard text copy, or SVG download fallback. The Inventory route renders active/completed quest journal rows with `pause-quest-*` selectors; `tests/e2e/full/side-quest.spec.ts` proves the mobile quest progress/reward path. The Bestiary route renders `lipu soweli` seen/caught rows from SQLite; tapping a seen/caught row opens the generated species description in the normal dialog bubble. The Party route renders portrait/name/HP/level rows, slot detail cards, selected-slot `kili` healing through persisted party HP, and lead promotion through persisted SQLite party-order updates. No keyboard simulation in E2E unless testing the desktop shortcut specifically.
-   The wild encounter combat menu keeps `rpg-dialog` choices as the input contract and now overlays `poki-wild-battle.ce` with lead/target creature cards, HP bars, an `utala` damage popup, and `poki` throw/result feedback. Unit tests lock the prompt face, battle-card model, type-scaled damage label, capture-state labels, and HP-result formatter; `tests/e2e/full/journey-golden-path.spec.ts` proves the overlay, `utala → poki`, throw/result feedback, and overlay teardown; `tests/e2e/full/party-panel.spec.ts` proves `ijo → kili` on an iPhone viewport before returning to catch flow.
-   Set-piece action-battle intros now swap the server player combat body/stats to the lead species sprite, build the generated lead-move model, open the `poki-lead-movebar` surface, render a sprite-local `poki-combat-target-reticle` around configured rival/jan lawa/final targets, and restore the field hero graphic after victory/defeat/map changes. The move bar is a mobile-first combat dock: it shows the current target/range pill, exposes a persistent bench switch row when the party has a conscious non-lead creature, and reflows move buttons into a 2x2 tap grid on phone-sized/coarse-pointer surfaces. The browser golden path asserts `species_kon_moli` during jan Ike combat setup and `hero` after victory with no page errors; `tests/e2e/full/action-battle-lead-movebar.spec.ts` runs on an iPhone viewport, catches a bench creature, captures the single-target cyan reticle screenshot, taps the switch row during jan Ike combat, proves party order and live battle sprite update, then taps the switched lead's visible move and proves SP spend, live HP damage, target state, touch-target size, and cooldown/ARIA state; integration asserts lead SP/stat sync.
-   The defeat/respawn overlay now ships on `poki-defeat-screen` with `data-testid="defeat-screen"`; `tests/e2e/full/defeat-respawn.spec.ts` proves the visible fade and safe-village return.
-   The contextual hint glyph now ships on `poki-hud-hint` with `data-testid="hint-glyph"`; `tests/e2e/full/mobile-hint.spec.ts` proves it renders near `jan-sewi`, taps through to dialog, hides while dialogs are open, and that tapping the player sprite itself triggers the same adjacent interaction.

Naming convention:

| Element                      | testid                                                                              |
| ---------------------------- | ----------------------------------------------------------------------------------- |
| HUD frame                    | `hud-frame`                                                                         |
| HUD status strip             | `hud-status`                                                                        |
| Hamburger menu               | `hud-menu-toggle`                                                                   |
| Pause overlay root           | `pause-overlay`                                                                     |
| Pause route tabs             | `pause-party`, `pause-vocab`, `pause-inventory`, `pause-bestiary`, `pause-settings` |
| Party slot N                 | `party-slot-{n}`                                                                    |
| Party heal slot N            | `party-heal-{n}`                                                                    |
| Wild battle overlay          | `wild-battle`                                                                       |
| Wild battle lead card        | `wild-battle-lead`                                                                  |
| Wild battle target card      | `wild-battle-target`                                                                |
| Wild battle damage popup     | `wild-battle-damage`                                                                |
| Wild battle capture feedback | `wild-battle-capture`                                                               |
| Defeat respawn overlay       | `defeat-screen`                                                                     |
| Contextual hint glyph        | `hint-glyph`                                                                        |
| Lead move bar root           | `lead-movebar`                                                                      |
| Lead move bar target         | `lead-movebar-target`                                                               |
| Lead switch row              | `lead-switch-panel`                                                                 |
| Lead switch slot N           | `lead-switch-slot-{n}`                                                              |
| Lead move button             | `lead-move-{moveId}`                                                                |
| Dialog choice N              | `.rpg-ui-dialog-choice[data-choice-index="{n}"]`                                    |
| Dialog advance               | `dialog-next`                                                                       |
| Save slot N                  | `save-slot-{n}`                                                                     |
| Close overlay                | `overlay-close`                                                                     |

## What this retires

-   **`src/modules/main/virtual-dpad.ts`** — tap-to-walk replaces virtual-stick input. Module + its 20 unit tests removed in the HUD-landing PR.
-   **Any mental model carrying over from v4's `@rpgjs/mobile-gui` plugin** — that plugin doesn't exist in v5, and our HUD doesn't mimic a retro handheld. No persistent A/B buttons. No bottom-centre d-pad. Interactions come to the player (contextual hint glyph), not the player to buttons.

## Non-goals

-   No custom framework (Solid/React/Vue). CanvasEngine + RPG.js GUI is the framework.
-   No `@rpgjs/mobile-gui` dependency (doesn't exist in v5; v4 version ties to nipplejs and DOM-only assumptions).
-   No retro-handheld HUD with fixed directional + action buttons. Mobile games don't look like that anymore.
-   No diagonals.
-   No orientation lock.
-   No fixed-pixel breakpoints.
