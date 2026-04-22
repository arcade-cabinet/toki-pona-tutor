---
title: Architecture
updated: 2026-04-22
status: current
domain: technical
---

<!--
  This doc reflects the v5 pivot through V19 (CR sweep + CI trifecta +
  comprehensive ROADMAP port). See CHANGELOG.md [Unreleased] for the
  running delta and docs/STATE.md for what's queued next.
-->

# poki soweli — Architecture

poki soweli is a creature-catching RPG whose world is named in toki pona. The player walks between seven regions, catches creatures in tall grass with a **poki** (net), builds a party of up to six, and beats the current four **jan lawa** (region masters) to open the final route.

Language is diegetic flavor, not mechanic. The player never translates — toki pona saturates the world and the vocabulary accumulates simply by playing.

## Tech stack

-   **Vite 8** — build + dev server.
-   **RPG.js v5 beta** (`@rpgjs/client`, `@rpgjs/server`, `@rpgjs/tiledmap`, `@rpgjs/vite`) — game engine, overworld scenes, Tiled tilemap rendering, event/NPC system, dialog, save hooks.
-   **CanvasEngine 2.0 beta** (`canvasengine`, `@canvasengine/presets`, `@canvasengine/compiler`) — underlying renderer used by RPG.js v5 (Pixi 8-backed).
-   **Pixi.js 8** — low-level sprite/tilemap rendering (via CanvasEngine).
-   **@rpgjs/action-battle** — wired for rival + jan lawa fights. Jan lawa use the legacy-named `gym-leader.ts` factory with optional multi-phase BattleAi (HP-threshold poller triggers `runPhaseTransition`). Set-piece intros sync the player combat body/stats to the lead party creature through `lead-battle-avatar.ts`; `lead-battle-skills.ts` builds the custom move bar model and applies registered skill damage without relying on RPG.js beta learned-skill array sync.
-   **@signe/di** — dependency injection / module composition used by RPG.js v5.
-   **TypeScript strict** throughout.
-   **Capacitor 8** for Android native wrapper; the web deploy target is GitHub Pages.

### What we removed in the pivot

-   Phaser 4 — replaced by RPG.js v5 + CanvasEngine.
-   Solid-JS / React / Tailwind — replaced by RPG.js v5's native GUI system. Custom HUD + overlays are authored as `.ce` (CanvasEngine) components and registered via `defineModule<RpgClient>({ gui: [...] })`. Styling uses `@rpgjs/ui-css` tokens overridden by `src/styles/brand.css`. See `docs/UX.md` for the full HUD architecture.
-   Koota ECS — entity management is now RPG.js v5's player/event model.
-   `vite-plugin-solid`, `@vitejs/plugin-react` — removed; `rpgjs()` Vite plugin replaces both.

## Persistence

Two storage tiers via Capacitor — never `localStorage` or `IndexedDB` directly in feature code.

### Small KV (`@capacitor/preferences`)

Used for: current map id, party slot pointer, settings flags, journey beat pointer, mastered-word count bookmark. Pattern: typed wrapper at `src/platform/persistence/preferences.ts` with a `KEYS` constant; localStorage shim only inside the wrapper as web fallback (Capacitor's own fallback on web).

### Structured / multi-row (`@capacitor-community/sqlite`)

Used for: full save snapshots (complete world state), mastered-words log (per-word timestamps), party rosters with full stats, encounter history, journal entries. Web fallback via `jeep-sqlite` / `sql.js`. Pattern at `src/platform/persistence/database.ts` — follows the mean-streets `prepareWebStore()` / `initWebStore` / `saveToStore` pattern exactly. `sql.js` is pinned through package-manager overrides so the web shim stays aligned with the tested Capacitor SQLite/jeep-sqlite stack.

RPG.js v5's save hook is wired to write through the sqlite adapter; on the client side the preferences wrapper is used for ephemeral small state.

## Two Pipelines, One Compiled Contract

The architecture separates **what the player does** (authored in Tiled) from **what the player reads** (authored in spine JSON, TP-resolved by build).

### The map pipeline (visual + spatial + interaction)

```
public/assets/tilesets/{core,seasons,snow,desert,fortress,indoor}/
  Art/                        — PNG tileset images
  Tiled/
    Tilesets/*.tsx            — Tiled tileset definitions (frame grids, collisions, custom props)
    Tilemaps/*.tmx            — Tiled sample maps (reference; real maps live under src/tiled/)

src/tiled/
  <map_id>.tmx                — authored maps consumed by tiledMapFolderPlugin at build time
  *.tsx                       — tileset references local to authored maps (symlink or copy)

Built/served at: /map/<map_id>  (via tiledMapFolderPlugin publicPath)
```

Map files use the following layer/object conventions (unchanged from the Phaser era):

```
  ├─ Tile layers: "Below Player" / "World" / "Above Player"
  ├─ Object layer: "Objects"
  │     ├─ Spawn Point (where player lands)
  │     ├─ Sign objects (with `text` custom property)
  │     ├─ NPC objects (with `id` + `dialog_id` custom properties)
  │     ├─ Warp objects (with `target_map` + `target_spawn` custom properties)
  │     └─ Trigger objects (scripted events like set-piece battles)
  └─ Object layer: "Encounters"
        └─ Rectangles defining tall-grass zones
           (with `species` weight-map custom property)
```

**Maps are build artifacts, not hand-authored.** The only way a map enters the repo is via a TypeScript spec in `scripts/map-authoring/specs/<id>.ts` built by `pnpm author:build <id>` (or `pnpm author:all --all`). Both `src/tiled/<id>.tmx` (runtime, consumed by `tiledMapFolderPlugin` from `@rpgjs/vite`) and `public/assets/maps/<id>.tmj` (archive + preview render) regenerate from the same source. Each spec also carries `biome` and `music_track`, emitted as Tiled map-level properties and mirrored by `src/content/map-metadata.ts` for runtime BGM. `pnpm author:verify` runs in `validate` + `prebuild` + CI and fails on any hand-edited, missing, orphaned, or drifted `.tmx`/`.tmj`. If you need to change a map: edit the spec, rebuild, commit the spec plus emitted artifacts.

RPG.js v5's `@rpgjs/tiledmap` package handles runtime rendering through CanvasEngine.

### The content pipeline (narrative + mechanical)

```
src/content/
  corpus/
    tatoeba.json              — vendored CC BY 2.0 FR corpus, immutable (37,666 TP↔EN pairs)
    LICENSE.md
  schema/                     — Zod schemas, source of truth for content shape
    species.ts
    move.ts
    item.ts
    npc.ts
    dialog.ts
    journey.ts                — ordered list of map-beats defining the 7-region arc
    index.ts
  spine/                      — hand-authored content (authors edit ONLY here)
    species/<id>.json
    moves/<id>.json
    items/<id>.json
    dialog/*.json             — dialog nodes keyed by `id`, referenced by map `dialog_id`
    journey.json              — ordered map arc + transitions + gates
  gameplay/                   — hand-authored runtime config JSON
    maps.json                 — labels, biome/music mirrors, safe spawns, default respawn
    events.json               — per-map runtime event factory payloads and intentional anchor offsets
    starters.json             — starter choices, initial level, initial items, mastered words
    progression.json          — badge display, party/save-slot limits, level curve, jan lawa XP curve, NG+, daycare, rematch scaling/rewards
    trainers.json             — rival/jan lawa stats, BattleAi tuning, rewards, phase config
    shops.json                — coin item, shop stock/NPC graphic/dialog/delivery target, battle coin rewards
    item-drops.json           — species-drop type/tier fallback data
    ambient.json              — day/night tint and weather probability tables
    combat.json               — creature type list, matchup matrix, status effects, wild-combat formulas, tag overrides, encounter timing
    effects.json              — effect spritesheet frame grids and animation strips
    language.json             — wan sitelen prompt pool and result copy
    visuals.json              — combat chrome, HP tiers/colors, tap selectors, sprite layouts, spritesheet manifests
    audio.json                — BGM/SFX event asset paths, base volumes, BGM selection, runtime audio timing, gameplay SFX cue mapping
    ui.json                   — HUD/combat/tap IDs/copy/retry tuning, lead move bar tuning/copy/templates, title/starter/pause/settings/inventory/save/vocab/party-panel/bestiary/quest/dialog/overlay/shop/wild-encounter/dictionary-export copy/templates/data, dialog IDs, notification durations, save-position snap timing, credits pages
    quests.json               — side-quest catalog
  generated/
    world.json                — compiled output, including map object layers, committed for reproducibility
```

**Authoring contract**: authors edit only `src/content/spine/`. Every Zod schema tags translatable string fields with a `.describe('tp')` marker. Those fields carry an `en` value at authoring time; `tp` is resolved at build time by matching against the Tatoeba corpus.

**Gameplay-config contract**: authored runtime catalogs live in `src/content/gameplay/*.json`, not scattered through RPG.js modules. `src/content/gameplay/schema.ts` validates those files with Zod at import time, and `src/content/gameplay/index.ts` normalizes JSON naming into the TypeScript shapes consumed by runtime modules. Use TypeScript for behavior and adapters; use JSON for map labels/safe spawns, runtime map event factory payloads, starter grants/mentor graphic, player default graphic, badges, party/save-slot limits, shop stock/NPC graphic/dialog/delivery target, battle rewards, level curves, trainer/final-boss battle stats/AI/rewards/defeat visuals, NG+ reset/scaling, daycare offspring tuning, jan lawa XP/rematch tuning, type matchups, status-effect rules, wild-combat formulas, encounter probabilities/timing, side quests, item-drop defaults, ambient weather/tint tables, combat chrome values, HP tiers/colors/labels, HUD/tap/combat UI IDs/timing/copy/retry tuning, lead move bar SP/cooldown/range tuning/copy/templates, sprite layouts, player/NPC/trainer/boss/effect manifests, audio event paths/volumes/selection/runtime timing/cue mapping, title/starter/pause/settings/inventory/save/vocabulary/party-panel/bestiary/quest journal/dialog fallback/defaults/SFX/shop/wild-encounter copy/choices/templates/dialog IDs, wan sitelen prompt/result copy, defeat/warp overlay ARIA/default phases, defeat revive dialog IDs, dictionary export text/SVG layout, notification templates/durations, save-position snap timing, and credits text. Event placement itself resolves from compiled TMJ objects in `world.json` via `src/content/map-objects.ts` and `src/modules/main/runtime-map-events.ts`; `events.json` should not duplicate absolute map coordinates. `tests/build-time/gameplay-config-boundary.test.ts` keeps that boundary enforceable by failing on new top-level runtime table literals outside the config layer unless they are explicitly allowlisted as behavior/schema adapters.

**Build steps**:

-   `pnpm validate-tp` — walks every `en`-tagged string in spine, confirms an exact Tatoeba pair exists. Exit 1 on any miss.
-   `pnpm build-spine` — validates spine files against Zod, resolves every `en` → canonical TP, and emits `src/content/generated/world.json` with both authored content and compiled TMJ object layers.
-   `pnpm prebuild` — runs validate + build-spine + typecheck before `vite build`.

Single-word dictionary TP values (`kili`, `soweli`, `moku`) are exempt — the validator only gates multi-word constructions.

## The journey model

Regions are **not authored** as a schema — they're Tiled map files. What IS authored in spine is the **journey**: an ordered manifest describing the player's arc through those maps.

```typescript
// src/content/schema/journey.ts
type JourneyBeat = {
    map_id: string; // matches src/tiled/<map_id>.tmx
    narrative: string; // prose describing what happens here (dev-facing only)
    gate?: {
        // optional: what unlocks progression out of this beat
        kind: "starter_chosen" | "catch_count" | "flag" | "defeated";
        params: Record<string, unknown>;
    };
    transition?: {
        // optional: how we cut to the next beat
        kind: "warp" | "dialog" | "combat" | "cutscene";
        trigger_object?: string; // name of the Tiled object that fires the transition
    };
};
type Journey = { beats: JourneyBeat[] };
```

The first beat's `map_id` is the start map, used in `src/modules/main/player.ts` to place the player on connect.

## RPG.js v5 module structure

```
src/
  standalone.ts             — entry point: provideRpg() for development (client+server in one process)
  server.ts                 — createServer() with providers (save, tiledmap, main module)
  client.ts                 — startGame() with provideMmorpg (production MMORPG mode)
  config/
    config.client.ts        — provideTiledMap, provideClientGlobalConfig, spritesheets
    creature-sprites.ts     — derives RPG.js species spritesheets from generated species sprite metadata
    player-sprites.ts / npc-sprites.ts / combatant-sprites.ts / boss-sprites.ts / effect-sprites.ts
                             — JSON-backed spritesheet registration
    provide-tap-controls.ts — mobile tap-to-walk and contextual interaction bridge
    provide-hud-menu-gui.ts / provide-pause-gui.ts
                             — HUD menu button, status strip, hint, and pause overlay GUI providers
    provide-combat-chrome.ts — registers action-battle HP-bar, hit-feedback, and target-reticle overlays
    provide-lead-movebar-gui.ts — registers the lead-creature action-battle move bar
    provide-defeat-screen-gui.ts — registers the full-screen defeat/respawn overlay
    provide-wild-battle-gui.ts — registers the wild encounter lead/target overlay
    provide-dialog-gui.ts    — branded dialog/typewriter GUI override
  modules/
    main/
      main.ts               — createModule('main', [{ server }]) export
      server.ts             — defineModule: player hooks + per-map event registrations
      player.ts             — RpgPlayerHooks: onConnected → changeMap + onDead respawn
      respawn.ts            — last-safe-village respawn, defeat overlay handoff, HP restore
      defeat-screen.ts      — pure view model for `poki-defeat-screen`
      dialog.ts             — TP-resolved dialog playback from spine
      vocabulary.ts         — TP tokenizer against the 131-word dictionary
      vocabulary-screen.ts  — pause-menu vocabulary screen (mastered words)
      inventory-screen.ts   — pause-menu badges + journey beat + party roster
      pause-menu.ts         — HUD-native pause overlay routes and route models
      party-panel.ts / bestiary-panel.ts
                             — party and lipu soweli route models
      starter-ceremony.ts   — jan Sewi starter pick (seli/telo/kasi triangle)
      encounter.ts          — tall-grass wild encounter, combat menu, poki capture, drops, XP
      wild-combat.ts        — wild-fight HP, catch, damage, and effectiveness helpers
      wild-combat-ui.ts     — wild-fight prompt/result/face formatting for rpg-dialog
      wild-battle-view.ts   — pure wild encounter overlay model for lead/target cards, damage, and capture states
      combat-chrome.ts      — action-battle HP-bar, hit-feedback, and target-reticle models shared by CanvasEngine overlays
      lead-battle-avatar.ts — set-piece combat body/stat sync from party slot 0
      lead-battle-skills.ts — generated lead move model, SP/cooldown state, and RPG.js skill application
      quest-runtime.ts / quest-npc.ts
                             — side-quest state transitions and giver/delivery NPC behavior
      runtime-map-events.ts — compiles TMJ object positions into runtime event placement
      warp.ts               — gated map-to-map transitions + loading overlay handoff
      warp-loading.ts       — pure destination-label/phase model for `poki-warp-loading`
      gym-leader.ts         — legacy-named rival/jan lawa factory with optional multi-phase BattleAi
      green-dragon.ts       — final boss; gated on all four region badges
      ambient-npc.ts        — villager/sign NPC factory
  content/
    gameplay/               — Zod-validated JSON config consumed by runtime modules
  scripts/
    map-authoring/
      specs/<id>.ts         — map source of truth (spec-driven .tmx + .tmj emit)
      cli/*.ts              — build/render/validate/all/verify/inspect/convert-tmx entry points
      lib/emitter.ts        — archive TMJ emitter
      lib/tmx-emitter.ts    — runtime TMX emitter
      lib/renderer.ts       — PNG preview renderer
      lib/validator.ts      — spec and artifact contract validation
      palettes/*.ts         — biome-specific tile key palettes
  platform/
    persistence/
      preferences.ts        — Capacitor Preferences typed wrapper (KEYS const)
      database.ts           — Capacitor SQLite + jeep-sqlite web fallback
      save-strategy.ts      — RPG.js v5 ISaveStorageStrategy implementation using sqlite
  tiled/                    — emitted .tmx maps consumed by tiledMapFolderPlugin
    ma_tomo_lili.tmx        — starter village map (beat 0)
```

## Game shape

### The party (player's character sheet)

The player has no standalone progression stats. Their `party[]` is up to 6 creatures. Each creature has HP, types, moves, XP, and a level. The current v0.2 action-battle bridge syncs the server player body, HP/SP/ATK/PDEF, and generated lead move bar model to party slot 0 for rival/jan lawa/final set-pieces, then applies selected moves through registered RPG.js skill damage without mutating the beta engine's learned-skill array. Configured rival/jan lawa/final targets render a sprite-local cyan reticle through `poki-combat-target-reticle.ce`, and the move bar exposes direct bench switching when another conscious creature is available. It restores the field `hero` sprite after combat. If the active battle lead faints and a bench creature still has HP, the runtime promotes the next conscious creature and refreshes the combat body/stats/move bar; if the full party is down, the player wakes in the last visited village with party restored (no permadeath). A deeper full-party battle command UI remains roadmap scope.

### XP + level-up curve

Every creature has a level 1–50 and an XP total. The threshold to reach level `n` from level 1 is:

    xpForLevel(n) = n^3        (level 1 = 1 xp, level 5 = 125, level 10 = 1000, level 50 = 125000)

This is the classic genre "medium-fast" growth — fast early levels, gentle ramp mid-game, meaningful grind toward the endgame. Level 1 → 2 costs 7 XP, level 5 → 6 costs 91 XP, level 10 → 11 costs 331 XP, level 20 → 21 costs 1261 XP.

On a victory or successful catch, `awardLeadVictoryXp()` applies the relevant reward to the lead creature: wild catches use half the caught species' `xp_yield`, jan Ike grants a fixed rival reward, and jan lawa use the regional XP curve. The helper canonicalizes starter XP floors before adding rewards, persists the new `party_roster.xp` / `level`, emits a non-blocking XP notification, emits one level-up notification per crossed boundary, and emits a new-move notification for moves learned at each crossed level.

### Types (rock-paper-scissors-extended)

Five types:

-   **seli** (fire) beats **kasi** (plant)
-   **telo** (water) beats **seli**
-   **kasi** beats **telo**
-   **lete** (ice) strong vs flying (`waso`-tagged species); weak offensive coverage otherwise
-   **wawa** (strong) no advantage/disadvantage; high raw damage — the bruiser type

Starters are the seli/telo/kasi triangle. `lete` and `wawa` species are catchable in later regions.

### Encounters

**Tall-grass random:** on each overworld step while inside an `Encounters` object-layer rectangle tagged tall-grass, roll the region's species weight table. On hit, transition to combat. Wild combat stays inside `rpg-dialog`: the target prompt can render the encountered species' idle face, `utala` damage is scaled by the lead-vs-target type matchup, and the feedback text reports `pona mute`, `awen`, or `pakala` before the updated HP.

**Set-piece:** hand-placed fights — rivals (jan Ike), jan lawa (jan Telo / jan Wawa / jan Lete / jan Suli), the final boss (green dragon at endgame).

### Catch mechanic

Every starter kit contains three **poki** (nets). During a wild fight the player can throw a poki in place of a move. Success = `(1 - enemy_hp / enemy_hp_max) * species.catch_rate * poki.power`. On success, the creature joins the party if a six-creature slot is open. On failure, the escaped outcome is logged and the encounter exits through the escaped dialog.

### Progression gates

Each journey beat may declare a gate. `catch_count >= N`, `starter_chosen`, `defeated:<npc_id>`, `flag:<flag_id>`.

## Engine entry points

```
index.html  →  src/standalone.ts (development: client + server in same Vite process)
                  └─  provideRpg(startServer)
                          └─  RPG.js v5 client boots
                                  └─  tiledmap plugin loads /map/<id>
                                  └─  player.onConnected → changeMap('ma_tomo_lili')
                                  └─  NPC events registered from server module
```

## What lives where (quick reference)

| Concern                       | Home                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Tile layout + layer structure | TypeScript specs in `scripts/map-authoring/specs/`, emitted to `.tmx` files in `src/tiled/`                                                                                                                                                                                                                                                                                                                                                |
| Player spawn location         | `Spawn Point` object in the map's Objects layer                                                                                                                                                                                                                                                                                                                                                                                            |
| NPC placement                 | NPC object in Objects layer; runtime event registered in `src/modules/main/server.ts`                                                                                                                                                                                                                                                                                                                                                      |
| NPC dialog content            | `src/content/spine/dialog/*.json` nodes referenced by `dialog_id` (Tatoeba-validated)                                                                                                                                                                                                                                                                                                                                                      |
| Warps                         | Warp object with `target_map` + `target_spawn`                                                                                                                                                                                                                                                                                                                                                                                             |
| Encounter zones               | Rectangles in `Encounters` object layer                                                                                                                                                                                                                                                                                                                                                                                                    |
| Species data                  | `src/content/spine/species/<id>.json`                                                                                                                                                                                                                                                                                                                                                                                                      |
| Move data                     | `src/content/spine/moves/<id>.json`                                                                                                                                                                                                                                                                                                                                                                                                        |
| Item data                     | `src/content/spine/items/<id>.json`                                                                                                                                                                                                                                                                                                                                                                                                        |
| Game arc                      | `src/content/spine/journey.json` + `docs/JOURNEY.md`                                                                                                                                                                                                                                                                                                                                                                                       |
| Runtime gameplay catalogs     | `src/content/gameplay/*.json` via `src/content/gameplay/index.ts`                                                                                                                                                                                                                                                                                                                                                                          |
| Save state (small KV)         | `src/platform/persistence/preferences.ts` (Capacitor Preferences)                                                                                                                                                                                                                                                                                                                                                                          |
| Save state (full snapshots)   | `src/platform/persistence/database.ts` (Capacitor SQLite)                                                                                                                                                                                                                                                                                                                                                                                  |
| RPG.js save hook              | `src/platform/persistence/save-strategy.ts`                                                                                                                                                                                                                                                                                                                                                                                                |
| Combat logic                  | `@rpgjs/action-battle/server` BattleAi via `src/modules/main/gym-leader.ts`; set-piece lead avatar sync in `src/modules/main/lead-battle-avatar.ts`; generated lead skill sync/use in `src/modules/main/lead-battle-skills.ts`; wild encounter helpers in `src/modules/main/wild-combat.ts`                                                                                                                                                |
| Combat chrome                 | `src/config/provide-combat-chrome.ts`, `src/config/poki-combat-hp-bar.ce`, `src/config/poki-combat-feedback.ce`, `src/config/poki-combat-target-reticle.ce`, `src/config/provide-lead-movebar-gui.ts`, `src/config/poki-lead-movebar.ce`, `src/config/provide-wild-battle-gui.ts`, `src/config/poki-wild-battle.ce`, `src/modules/main/combat-chrome.ts`, `src/modules/main/wild-battle-view.ts`, and combat CSS in `src/styles/brand.css` |
| Creature spritesheets         | `src/config/creature-sprites.ts` derives RPG.js sheets from all generated species sprite metadata, including action-battle `stand` / `walk` / `attack` fallbacks                                                                                                                                                                                                                                                                           |
| Multi-phase bosses            | legacy-named `gym-leader.ts` `phase2` descriptor + HP-threshold poller                                                                                                                                                                                                                                                                                                                                                                     |
| Badge tracking                | `db_flag` rows keyed `badge_<region>`; `inventory-screen.ts` reads                                                                                                                                                                                                                                                                                                                                                                         |
| Map emission                  | `scripts/map-authoring/` specs + emitters (runs in `pnpm validate`)                                                                                                                                                                                                                                                                                                                                                                        |

## Test infrastructure

Vitest owns pure build-time tests and in-process RPG.js integration tests. Playwright owns real-browser smoke/full E2E under `tests/e2e/`; the full browser suite uses the dev-only `window.__POKI__.testing` surface for controlled server-side event setup while still resolving behavior through the live browser GUI. See `docs/TESTING.md`.

## What we explicitly DO NOT have

-   **No Phaser, Koota, React, Solid, Tailwind.** Removed in the RPG.js v5 pivot.
-   **No region schema.** Maps are Tiled files, not JSON.
-   **No procgen.** The world is authored end-to-end.
-   **No translation UI.** No EN glosses shown to the player.
-   **No mixed tileset families.** Fan-tasy is the sole tileset source.
-   **No copyrighted-property references.** Not in code, comments, docs, or asset names.
-   **No direct `localStorage` / `IndexedDB`** in feature code. Capacitor abstractions only.

## Decision log

-   **RPG.js v5 beta pivot** (2026-04-19) — the Phaser 4 + Solid + Koota stack was closed in favor of RPG.js v5 which provides: Tiled tilemaps out of the box (`@rpgjs/tiledmap`), built-in event/NPC model, a save abstraction (`ISaveStorageStrategy`), a CanvasEngine `.ce` GUI system, and a standalone dev mode (no external server needed). The content pipeline (`src/content/`), Fan-tasy tilesets (`public/assets/tilesets/`), and journey model are preserved unchanged.
-   **RPG.js-native GUI, no bolt-ons** (2026-04-20) — the HUD, pause overlay, party panel, and every custom surface are authored as `.ce` (CanvasEngine) files registered via RPG.js's unified GUI system. No SolidJS, no Vue, no React. Reactivity comes from CanvasEngine signals (same model as Solid) which RPG.js already threads through the client engine. Mobile-first, tap-to-walk is primary input (keyboard is a desktop shortcut to the same actions), 4-way movement only. See `docs/UX.md` for the HUD spec.
-   **Pre-Godot spike base** (`0a582e0`) — repo history includes a pre-Godot Phaser+Koota tip that informed the current pivot, but current work should not assume it happens on any special historical branch.
-   **Fan-tasy tilesets unified** — a single coherent art family (6 biome packs) replaces the prior Kenney + Lonesome Forest + Old Town patchwork.
-   **Boss vs creature tiering by animation depth** — animated sprites (`bosses/`); static sprites (`creatures/`). Green dragon is the designated final boss.
-   **Capacitor persistence** — `@capacitor/preferences` for small KV, `@capacitor-community/sqlite` for structured data. No `localStorage` in feature code.
