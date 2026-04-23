---
title: Architecture
updated: 2026-04-22
status: current
domain: technical
---

# Architecture

Rivers Reckoning is a native-English creature-catching RPG. Rivers explores seven authored regions, catches monsters, builds a party of up to six, solves local problems, defeats four region masters, and reaches the green-dragon finale.

The former language-learning layer has been removed. Current narrative, quests, UI, combat feedback, and NPC copy are authored directly in English. Investigation progress is represented by curated clues in `src/content/clues.json`.

## Stack

- **Vite 8** for development and bundling.
- **RPG.js v5 beta** for maps, player/event runtime, GUI lifecycles, and save hooks.
- **CanvasEngine 2 beta + Pixi 8** under RPG.js for rendering.
- **React + Radix primitives + Motion** for the player-facing `rr-ui` overlay.
- **@rpgjs/action-battle** for rival, region-master, and final set-piece fights.
- **Capacitor 8** for Android debug APK builds and native storage adapters.
- **TypeScript strict** for runtime, build tooling, and tests.
- **JSON + Zod** for gameplay configuration and authored content validation.

Custom player-facing GUI surfaces live in `src/ui/` and mount at `#rr-ui-root`. RPG.js `.ce` files registered from `src/config/` are bridge adapters that publish state into `RiversUiBridge` and call back into RPG.js GUI promises. There is no Vue, Solid, or Tailwind runtime.

## Deploy Bases

The same app is built with three base contracts:

- local dev/preview is `/`
- GitHub Pages is `/poki-soweli/`
- Capacitor is `./`

The Pages path remains `/poki-soweli/` because that is the repository/deployment path. The product name shown to players is Rivers Reckoning.

## Persistence

Feature code does not call `localStorage` or `IndexedDB` directly.

- `src/platform/persistence/preferences.ts` wraps Capacitor Preferences for small key/value state.
- `src/platform/persistence/database.ts` wraps Capacitor SQLite with the web shim for save slots, party rosters, encounter history, clue sightings, sentence/field logs, and flags.
- Some table and column names still use legacy identifiers such as `mastered_words` and `tp_word` to preserve save compatibility. New product copy and new runtime APIs should use clue terminology.

Save schema changes bump `DB_VERSION` and add a migration in `migrateSchema()`.

## Map Pipeline

Maps are build artifacts. The source of truth is TypeScript under `scripts/map-authoring/specs/`.

```text
scripts/map-authoring/specs/<map_id>.ts
  -> pnpm author:build <map_id>
  -> src/tiled/<map_id>.tmx
  -> public/assets/maps/<map_id>.tmj
  -> public/assets/maps/<map_id>.preview.png
```

`pnpm author:all --all` regenerates every authored map. `pnpm author:verify` fails when generated artifacts are missing, orphaned, or drifted from specs.

Current authored map IDs:

- `riverside_home`
- `greenwood_road`
- `highridge_pass`
- `lakehaven`
- `frostvale`
- `dreadpeak_cavern`
- `rivergate_approach`

Map specs own spatial truth: objects, warps, encounter rectangles, NPC placement, biome, music track, and emitted Tiled metadata. Runtime modules consume compiled object coordinates from `src/content/generated/world.json`.

## Art Curation

Map palettes should resolve through the curated art manifest at `src/content/art/tilesets.json`. The manifest classifies usable and rejected tiles by role: solid fill, transparent overlay, multi-tile object, transition, animated, collision blocker, or reject.

Rejected tiles must remain explicit in the manifest so they cannot be rediscovered accidentally. Direct raw tile IDs should stay inside art-curation tooling or derived tileset emitters, not scattered through map specs.

## Content Pipeline

Authored narrative/mechanical content lives under `src/content/spine/`.

```text
src/content/spine/**/*.json
  -> pnpm build-spine
  -> src/content/generated/world.json
```

`scripts/build-spine.mjs` validates Zod schemas, checks cross-references, merges compiled map object data, and emits committed generated content. Authors edit spine JSON and gameplay JSON; they do not hand-edit `src/content/generated/world.json`.

Gameplay configuration lives in `src/content/gameplay/*.json` and is validated by `src/content/gameplay/schema.ts`. Runtime modules import normalized config from `src/content/gameplay/index.ts`.

Important runtime catalogs include:

- `maps.json` for map labels, safe spawns, and respawn metadata.
- `events.json` for event factory payloads keyed by map objects.
- `starters.json`, `trainers.json`, `quests.json`, `shops.json`, and `progression.json` for game progression.
- `combat.json`, `visuals.json`, `audio.json`, and `ui.json` for gameplay formulas, chrome, sounds, and copy.
- `language.json` for the Field Notes clue-check micro-game.

## Runtime Shape

Key entrypoints:

- `src/standalone.ts` boots local development with client and server in one process.
- `src/server.ts` and `src/client.ts` provide production split entrypoints.
- `src/modules/main/server.ts` registers maps, player hooks, and event factories.
- `src/modules/main/player.ts` handles initial placement, respawn, save hooks, and player lifecycle.

High-impact modules:

- `starter-ceremony.ts` gives Rivers a starter and initial capture pods.
- `encounter.ts` drives wild encounters, catch/defeat outcomes, item drops, XP, and wild-battle UI.
- `gym-leader.ts`, `jan-ike.ts`, and `green-dragon.ts` drive set-piece action battles.
- `lead-battle-avatar.ts` and `lead-battle-skills.ts` bridge party creatures into action-battle bodies and the movebar.
- `quest-runtime.ts` advances side quests from catches, delivery, and completion.
- `vocabulary.ts`, `vocabulary-screen.ts`, and `dictionary-export.ts` are legacy-named clue-journal modules.
- `runtime-map-events.ts` compiles generated TMJ object placement into live RPG.js events.

## Game Shape

The player has no standalone stats. The party is the character sheet. Each creature has a type, level, XP, HP, moves, rarity/catch difficulty, and optional drop table.

Types remain stable internal combat IDs:

- `seli` = fire
- `telo` = water
- `kasi` = plant
- `lete` = ice
- `wawa` = force/neutral bruiser

These IDs are internal data contracts for existing content and saves. User-facing copy should prefer English labels where natural.

## Verification

Use the normal gates:

```sh
pnpm validate
pnpm build-spine
pnpm typecheck
pnpm test:unit
pnpm test:integration
pnpm test:e2e:smoke
pnpm build
GITHUB_PAGES=true pnpm build
pnpm android:build-debug
```

Map-tooling verification:

```sh
pnpm author:verify
pnpm author:all --all
pnpm author:all --all --dry-run
```

After regeneration, there should be no unexpected diff across `src/tiled/*.tmx`, `public/assets/maps/*.tmj`, or `public/assets/maps/*.preview.png`.
