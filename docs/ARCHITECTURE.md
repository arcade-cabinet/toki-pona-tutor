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

- **Vite 6** — build + dev server.
- **React 18** — app shell (title screen, menus, settings, dictionary view).
- **Solid-JS 1.9** — in-game UI overlays (dialog, combat, toasts, typewriter). Lower overhead than React for high-frequency updates over a Phaser canvas.
- **Phaser 4** — overworld scenes, physics, input, Tiled tilemap rendering, spritesheet animation.
- **Koota 0.6** — ECS for in-world entities (creatures, NPCs, triggers, save state).
- **TypeScript strict** throughout.
- **Tailwind** for shell styling.
- **Web Audio + Howler** for SFX/BGM.
- **Capacitor 8** for Android native wrapper; web deploys to GitHub Pages.

## Two pipelines, two sources of truth

The architecture separates **what the player does** (authored in Tiled) from **what the player reads** (authored in spine JSON, TP-resolved by build).

### The map pipeline (visual + spatial + interaction)

```
public/assets/tilesets/{core,seasons,snow,desert,fortress,indoor}/
  Art/                        — PNG tileset images
  Tiled/
    Tilesets/*.tsx            — Tiled tileset definitions (frame grids, collisions, custom props)
    Tilemaps/*.tmx            — Tiled sample maps (reference; real maps live under public/assets/maps/)

public/assets/maps/<map_id>.tmj
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

Authors edit `.tmx` files in the Tiled editor. Phaser's built-in tilemap loader (`load.tilemapTiledJSON` + `make.tilemap` + `addTilesetImage`) reads them at runtime. **There is no region schema** — the Tiled map file IS the region. Collision is per-tile via the `collides: true` custom property set in Tiled.

This is adopted wholesale from the [`remarkablegames/phaser-rpg`](https://github.com/remarkablegames/phaser-rpg) pattern (modernized from Phaser 3 → 4, phaser-jsx → Solid).

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
    journey.ts                — NEW: ordered list of map-beats defining the 7-region arc
    koota-gen.ts              — zodToKootaTrait()
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
- `pnpm validate-tp` — walks every `en`-tagged string in spine, confirms an exact Tatoeba pair exists. Exit 1 on any miss. Prints closest matches on failure.
- `pnpm build-spine` — validates spine files against Zod, resolves every `en` → canonical TP, emits `src/content/generated/world.json`.
- `pnpm prebuild` — runs validate + build-spine + typecheck before `vite build`.
- CI (`.github/workflows/content-validate.yml`) runs validate-tp + build-spine on every PR. A failing validation cannot merge.

Single-word dictionary TP values (`kili`, `soweli`, `moku`) are exempt — the validator only gates multi-word constructions.

### Zod → Koota bridge

`zodToKootaTrait(schema)` returns a Koota trait whose shape is the schema's inferred TypeScript type. At scene-boot the engine loads `generated/world.json`, iterates entities, and instantiates Koota entities tagged with the relevant traits. One source of truth for both content and runtime state.

## The journey model

Regions are **not authored** as a schema — they're Tiled map files. What IS authored in spine is the **journey**: an ordered manifest describing the player's arc through those maps.

```typescript
// src/content/schema/journey.ts
type JourneyBeat = {
  map_id: string;           // matches public/assets/maps/<map_id>.tmj
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

The journey file is the spine of the game. You read it top-to-bottom and understand the whole arc. Maps are atomic. Transitions between maps are named triggers. See `docs/JOURNEY.md` for the prose creative-writing pass and `src/content/spine/journey.json` for the machine-readable version.

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

**Set-piece:** hand-placed fights — rivals (jan Ike), gym masters (jan Telo / jan Wawa / jan Lete / jan Suli), the final boss (green dragon at endgame). These are Tiled object-layer triggers with a `scripted_combat` custom property; not random.

### Catch mechanic

Every starter kit contains three **poki** (nets). During a wild fight the player can throw a poki in place of a move. Success = `(1 - enemy_hp / enemy_hp_max) * species.catch_rate * poki.power`. On success, the creature joins the party (if ≤ 5). On failure, the wild creature gets its turn.

### Progression gates

Each journey beat may declare a gate. `catch_count >= N` (must catch N distinct species in this region before the next beat's warp is active), `starter_chosen` (must pick a starter before leaving ma_tomo_lili), `defeated:<npc_id>` (must beat a specific NPC), `flag:<flag_id>` (arbitrary gate flag).

## Engine sketch

```
index.html  →  main.tsx (React root)
                  └─  App.tsx (title screen, menu routing)
                          └─  PhaserGame.tsx (lazy-loaded)
                                  └─  Phaser.Game
                                          ├─  Boot scene (preload every map + tileset + atlas)
                                          ├─  Menu scene (pause, settings, party)
                                          └─  Main scene (the overworld loop)
                                                  ├─  reads current beat from journey.json
                                                  ├─  loads map_id from public/assets/maps/
                                                  ├─  spawns Player at Spawn Point
                                                  ├─  wires Objects (signs, NPCs, warps, triggers)
                                                  ├─  arms Encounters roller
                                                  └─  emits events on gameBus for Solid overlays

Solid overlays (mounted on top of the Phaser canvas):
  ├─  DialogOverlay     — typewriter text + choice menus; reads dialog from spine/dialog/
  ├─  CombatOverlay     — HP bars, move buttons, poki-throw button; reads combat/engine.ts
  ├─  ToastOverlay      — quick text notifications
  └─  AdventureHUD      — region name, party summary, badge count
```

The engine is small on purpose. The content pipeline + Tiled maps are where the richness lives.

## What lives where (quick reference)

| Concern | Home |
|---|---|
| Tile layout + layer structure | `.tmx` files (authored in Tiled) |
| Tile collision | Tiled tileset custom property `collides: true` |
| Player spawn location | `Spawn Point` object in the map's Objects layer |
| Sign text | `text` custom property on a Sign object |
| NPC placement | NPC object in Objects layer with `id` + `dialog_id` custom properties |
| NPC dialog content | `src/content/spine/dialog/<npc_id>.json` (Tatoeba-validated) |
| Warps | Warp object with `target_map` + `target_spawn` custom properties |
| Encounter zones | Rectangles in `Encounters` object layer with `species` weight property |
| Set-piece triggers | Trigger object with `scripted_combat` / `scripted_dialog` custom property |
| Species data | `src/content/spine/species/<id>.json` |
| Move data | `src/content/spine/moves/<id>.json` |
| Item data | `src/content/spine/items/<id>.json` |
| Game arc | `src/content/spine/journey.json` + `docs/JOURNEY.md` |
| Save state | `src/game/ecs/saveState.ts` → `localStorage` |
| Combat logic | `src/game/combat/engine.ts` (pure functions, no UI) |
| Type matchup math | `src/content/schema/types.ts` |

## Test infrastructure

The game is exercised end-to-end via a **Vitest browser harness** (Playwright-backed, chromium). A `window.__toki_harness__` inspector (dev-only, gated by `import.meta.env.DEV`) lets tests read live scene state — player tile, current map id, dialog open, party contents — without DOM-scraping.

Tests replay a **deterministic playbook** generated by a factory from `world.json`. The playbook visits every region, exercises every NPC, triggers every encounter class, wins required fights, captures screenshots at every step. See `docs/TESTING.md`.

## What we explicitly DO NOT have

- **No region schema.** Maps are Tiled files, not JSON.
- **No procgen.** The world is authored end-to-end.
- **No translation UI.** No EN glosses shown to the player.
- **No mixed tileset families.** Fan-tasy is the sole tileset source.
- **No copyrighted-property references.** Not in code, comments, docs, or asset names. See `STANDARDS.md`.

## Decision log

- **Pre-Godot spike base** (`0a582e0`) — this branch resurrects the pre-Godot Phaser+Koota tip; the Godot branch on `main` proved more fighting than it was worth.
- **Fan-tasy tilesets unified** — a single coherent art family (6 biome packs) replaces the prior Kenney + Lonesome Forest + Old Town patchwork that sank the previous playthrough's tonal consistency.
- **Boss vs creature tiering by animation depth** — animated sprites (green-dragon, dread-knight, slime, fire-skull, zombie-burster) live under `bosses/`; static sprites under `creatures/`. Green dragon is the designated final boss (only creature with a death animation).
- **Scaffolding from remarkablegames/phaser-rpg** — adopted wholesale; Tiled IS the schema for regions. Rejected: custom region JSON schema + tile-key resolver (the previous attempt and primary source of asset-layer drift).
