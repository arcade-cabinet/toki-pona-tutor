---
title: Architecture
updated: 2026-04-19
status: current
domain: technical
---

# poki soweli — Architecture

poki soweli is a creature-catching RPG whose world is named in toki pona. The player walks between regions, catches creatures in tall grass with a **poki** (net), builds a party of up to six, and beats a **jan lawa** (master) in each region to progress.

Language is diegetic flavor, not mechanic. The player never translates — toki pona saturates the world and the vocabulary accumulates simply by playing.

## Tech stack

- **Vite 8** — build + dev server.
- **RPG.js v5 beta** (`@rpgjs/client`, `@rpgjs/server`, `@rpgjs/tiledmap`, `@rpgjs/vite`) — game engine, overworld scenes, Tiled tilemap rendering, event/NPC system, dialog, save hooks.
- **CanvasEngine 2.0 beta** (`canvasengine`, `@canvasengine/presets`, `@canvasengine/compiler`) — underlying renderer used by RPG.js v5 (Pixi 8-backed).
- **Pixi.js 8** — low-level sprite/tilemap rendering (via CanvasEngine).
- **@rpgjs/action-battle** — built-in action-battle module (wired later; placeholder in v5 module structure for now).
- **@signe/di** — dependency injection / module composition used by RPG.js v5.
- **TypeScript strict** throughout.
- **Capacitor 8** for Android native wrapper; web deploys to GitHub Pages.

### What we removed in the pivot

- Phaser 4 — replaced by RPG.js v5 + CanvasEngine.
- Solid-JS / React / Tailwind — replaced by RPG.js v5's built-in Vue-compat GUI system (`@rpgjs/ui-css`).
- Koota ECS — entity management is now RPG.js v5's player/event model.
- `vite-plugin-solid`, `@vitejs/plugin-react` — removed; `rpgjs()` Vite plugin replaces both.

## Persistence

Two storage tiers via Capacitor — never `localStorage` or `IndexedDB` directly in feature code.

### Small KV (`@capacitor/preferences`)

Used for: current map id, party slot pointer, settings flags, journey beat pointer, mastered-word count bookmark. Pattern: typed wrapper at `src/platform/persistence/preferences.ts` with a `KEYS` constant; localStorage shim only inside the wrapper as web fallback (Capacitor's own fallback on web).

### Structured / multi-row (`@capacitor-community/sqlite`)

Used for: full save snapshots (complete world state), mastered-words log (per-word timestamps), party rosters with full stats, encounter history, journal entries. Web fallback via `jeep-sqlite` / `sql.js`. Pattern at `src/platform/persistence/database.ts` — follows the mean-streets `prepareWebStore()` / `initWebStore` / `saveToStore` pattern exactly.

RPG.js v5's save hook is wired to write through the sqlite adapter; on the client side the preferences wrapper is used for ephemeral small state.

## Two pipelines, two sources of truth

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

Authors edit `.tmx` files in the Tiled editor. `tiledMapFolderPlugin` from `@rpgjs/vite` copies + processes them at build time. RPG.js v5's `@rpgjs/tiledmap` package handles runtime rendering through CanvasEngine.

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
    dialog/<npc_id>.json      — per-NPC dialog nodes keyed to dialog_id in the .tmx
    journey.json              — ordered map arc + transitions + gates
  generated/
    world.json                — compiled output, committed for reproducibility
```

**Authoring contract**: authors edit only `src/content/spine/`. Every Zod schema tags translatable string fields with a `.describe('tp')` marker. Those fields carry an `en` value at authoring time; `tp` is resolved at build time by matching against the Tatoeba corpus.

**Build steps**:
- `pnpm validate-tp` — walks every `en`-tagged string in spine, confirms an exact Tatoeba pair exists. Exit 1 on any miss.
- `pnpm build-spine` — validates spine files against Zod, resolves every `en` → canonical TP, emits `src/content/generated/world.json`.
- `pnpm prebuild` — runs validate + build-spine + typecheck before `vite build`.

Single-word dictionary TP values (`kili`, `soweli`, `moku`) are exempt — the validator only gates multi-word constructions.

## The journey model

Regions are **not authored** as a schema — they're Tiled map files. What IS authored in spine is the **journey**: an ordered manifest describing the player's arc through those maps.

```typescript
// src/content/schema/journey.ts
type JourneyBeat = {
  map_id: string;           // matches src/tiled/<map_id>.tmx
  narrative: string;        // prose describing what happens here (dev-facing only)
  gate?: {                  // optional: what unlocks progression out of this beat
    kind: 'starter_chosen' | 'catch_count' | 'flag' | 'defeated';
    params: Record<string, unknown>;
  };
  transition?: {            // optional: how we cut to the next beat
    kind: 'warp' | 'dialog' | 'combat' | 'cutscene';
    trigger_object?: string;  // name of the Tiled object that fires the transition
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
    config.server.ts        — (placeholder; server config if needed)
  modules/
    main/
      player.ts             — RpgPlayerHooks: onConnected → changeMap to first journey beat
      event.ts              — NPC event factory (jan Sewi starter ceremony, etc.)
      server.ts             — defineModule: player hooks + map event registrations
      index.ts              — createModule('main', [{ server }]) export
  platform/
    persistence/
      preferences.ts        — Capacitor Preferences typed wrapper (KEYS const)
      database.ts           — Capacitor SQLite + jeep-sqlite web fallback
      save-strategy.ts      — RPG.js v5 ISaveStorageStrategy implementation using sqlite
  tiled/                    — authored .tmx maps + tileset refs (consumed by tiledMapFolderPlugin)
    ma_tomo_lili.tmx        — starter village map (beat 0)
    Tileset_Ground.tsx      — symlinked from public/assets/tilesets/core/Tiled/Tilesets/
```

## Game shape

### The party (player's character sheet)

The player has no stats. Their `party[]` is up to 6 creatures. Each creature has HP, types, moves, XP, and a level. When the lead faints, the next comes out automatically; when the whole party faints, the player wakes in the last visited village with party restored (no permadeath).

### Types (rock-paper-scissors-extended)

Five types:

- **seli** (fire) beats **kasi** (plant)
- **telo** (water) beats **seli**
- **kasi** beats **telo**
- **lete** (ice) strong vs flying (`waso`-tagged species); weak offensive coverage otherwise
- **wawa** (strong) no advantage/disadvantage; high raw damage — the bruiser type

Starters are the seli/telo/kasi triangle. `lete` and `wawa` species are catchable in later regions.

### Encounters

**Tall-grass random:** on each overworld step while inside an `Encounters` object-layer rectangle tagged tall-grass, roll the region's species weight table. On hit, transition to combat.

**Set-piece:** hand-placed fights — rivals (jan Ike), gym masters (jan Telo / jan Wawa / jan Lete / jan Suli), the final boss (green dragon at endgame).

### Catch mechanic

Every starter kit contains three **poki** (nets). During a wild fight the player can throw a poki in place of a move. Success = `(1 - enemy_hp / enemy_hp_max) * species.catch_rate * poki.power`. On success, the creature joins the party (if ≤ 5). On failure, the wild creature gets its turn.

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

| Concern | Home |
|---|---|
| Tile layout + layer structure | `.tmx` files in `src/tiled/` (authored in Tiled) |
| Player spawn location | `Spawn Point` object in the map's Objects layer |
| NPC placement | NPC object in Objects layer; event factory in `src/modules/main/event.ts` |
| NPC dialog content | `src/content/spine/dialog/<npc_id>.json` (Tatoeba-validated) |
| Warps | Warp object with `target_map` + `target_spawn` |
| Encounter zones | Rectangles in `Encounters` object layer |
| Species data | `src/content/spine/species/<id>.json` |
| Move data | `src/content/spine/moves/<id>.json` |
| Item data | `src/content/spine/items/<id>.json` |
| Game arc | `src/content/spine/journey.json` + `docs/JOURNEY.md` |
| Save state (small KV) | `src/platform/persistence/preferences.ts` (Capacitor Preferences) |
| Save state (full snapshots) | `src/platform/persistence/database.ts` (Capacitor SQLite) |
| RPG.js save hook | `src/platform/persistence/save-strategy.ts` |
| Combat logic | `@rpgjs/action-battle` module (wired in later layer) |

## Test infrastructure

Vitest browser harness (Playwright-backed, chromium) in `tests/e2e/`. RPG.js v5 exposes a `window.__rpg_harness__` shim (dev-only) for reading live scene state without DOM-scraping. See `docs/TESTING.md`.

## What we explicitly DO NOT have

- **No Phaser, Koota, React, Solid, Tailwind.** Removed in the RPG.js v5 pivot.
- **No region schema.** Maps are Tiled files, not JSON.
- **No procgen.** The world is authored end-to-end.
- **No translation UI.** No EN glosses shown to the player.
- **No mixed tileset families.** Fan-tasy is the sole tileset source.
- **No copyrighted-property references.** Not in code, comments, docs, or asset names.
- **No direct `localStorage` / `IndexedDB`** in feature code. Capacitor abstractions only.

## Decision log

- **RPG.js v5 beta pivot** (2026-04-19) — the Phaser 4 + Solid + Koota stack (L1 PR #64) was closed in favor of RPG.js v5 which provides: Tiled tilemaps out of the box (`@rpgjs/tiledmap`), built-in event/NPC model, a save abstraction (`ISaveStorageStrategy`), Vue-compat GUI screens, and a standalone dev mode (no external server needed). The content pipeline (`src/content/`), Fan-tasy tilesets (`public/assets/tilesets/`), and journey model are preserved unchanged.
- **Pre-Godot spike base** (`0a582e0`) — this branch resurrects the pre-Godot Phaser+Koota tip; the Godot branch on `main` proved more fighting than it was worth.
- **Fan-tasy tilesets unified** — a single coherent art family (6 biome packs) replaces the prior Kenney + Lonesome Forest + Old Town patchwork.
- **Boss vs creature tiering by animation depth** — animated sprites (`bosses/`); static sprites (`creatures/`). Green dragon is the designated final boss.
- **Capacitor persistence** — `@capacitor/preferences` for small KV, `@capacitor-community/sqlite` for structured data. No `localStorage` in feature code.
