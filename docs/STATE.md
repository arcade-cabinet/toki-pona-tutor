---
title: Current State
updated: 2026-04-19
status: current
domain: context
---

# Where we are — 2026-04-19

**RPG.js v5 pivot.** PRs #64 (L1 Phaser foundation) and #65 (L3 Journey schema) were closed. The engine is now **RPG.js v5 beta** on branch `feat/rpgjs-v5-pivot`.

## Rationale for the pivot

RPG.js v5 gives us for free:
- Tiled tilemap loading (`@rpgjs/tiledmap`, `tiledMapFolderPlugin`) — the primary map-pipeline requirement.
- Built-in event/NPC model — replaces the Tiled Object-layer wiring we were porting from `remarkablegames/phaser-rpg`.
- `ISaveStorageStrategy` — a clean hook for our Capacitor persistence adapters.
- Standalone dev mode (`provideRpg`) — no external server needed during development.
- Vue-compat GUI screens — replaces the React + Solid shell.
- `@rpgjs/action-battle` — combat module we can wire in a later layer.

What we keep from the Phaser era:
- `src/content/` — corpus, spine, schema, generated world.json (unchanged).
- `public/assets/` — Fan-tasy tilesets, player, bosses, creatures, npcs, combatants, effects (unchanged).
- `scripts/` — validate-tp, validate-challenges, build-spine, map-authoring toolchain (unchanged).
- `docs/` — all docs updated, none deleted.
- `tests/e2e/` — Vitest browser harness scaffolding (to be rewired to RPG.js v5 hooks).

## Just landed

### RPG.js v5 application shell

- `package.json` — replaced Phaser/React/Solid/Koota deps with `@rpgjs/*`, `canvasengine`, `@canvasengine/*`, `pixi.js`, `@signe/di`.
- `vite.config.ts` — uses `rpgjs()` plugin + `tiledMapFolderPlugin` pointing at `src/tiled/`.
- `tsconfig.json` — updated for RPG.js v5 (experimentalDecorators, emitDecoratorMetadata, bundler resolution).
- `index.html` — RPG.js v5 shell (div#rpg, ui-css links, Fredoka font).
- `src/standalone.ts` — `provideRpg(startServer)` entry for development.
- `src/server.ts` — `createServer()` with CapacitorSaveStorageStrategy + tiledmap + main module.
- `src/client.ts` — `startGame()` with `provideMmorpg` for production.
- `src/config/config.client.ts` — tilemap basePath, Fan-tasy character spritesheets.
- `src/modules/main/player.ts` — `onConnected` places player at `ma_tomo_lili` (first journey beat).
- `src/modules/main/event.ts` — jan Sewi NPC event factory (starter ceremony placeholder).
- `src/modules/main/server.ts` — `defineModule` with player hooks + map event registrations.
- `src/modules/main/index.ts` — `createModule('main', ...)` export.

### Capacitor persistence layer

- `src/platform/persistence/preferences.ts` — typed Capacitor Preferences wrapper, `KEYS` const.
- `src/platform/persistence/database.ts` — Capacitor SQLite + jeep-sqlite web fallback, `prepareWebStore()` pattern.
- `src/platform/persistence/save-strategy.ts` — `ISaveStorageStrategy` implementation wired to sqlite.

### Starter map

- `src/tiled/ma_tomo_lili.tmx` — starter village map using Fan-tasy core tileset (16×12 tiles, Tileset_Ground.tsx).
- Tileset TSX symlinked into `src/tiled/` so Tiled editor can resolve it.

### Deleted Phaser-era code

- `src/game/` — all Phaser scenes, Solid overlays, Koota ECS, combat engine.
- `src/components/` — React shell.
- `src/App.tsx`, `src/main.tsx`, `src/hooks/`, `src/lib/` — removed.

### Docs updated

- `docs/ARCHITECTURE.md` — rewritten for RPG.js v5 stack.
- `docs/STATE.md` — this file.
- `CLAUDE.md` — Commands section updated for new stack.

## In flight (next layers)

### V1 — Player walks around (done with this PR)
The dev server boots, `ma_tomo_lili.tmx` loads, the Fan-tasy character walks.

### V2 — Warps + second map
- Author `nasin_wan.tmx` (route 1 from journey.json beat 2).
- Warp object from `ma_tomo_lili` → `nasin_wan` and back.
- Warp object uses `target_map` + `target_spawn` custom props (RPG.js v5 handles teleport).

### V3 — NPC dialog + starter ceremony
- Jan Sewi event: show text greeting, offer 3 starters (seli/telo/kasi), set `starter_chosen` flag.
- Dialog content wired through `src/content/spine/dialog/jan_sewi.json`.
- `pnpm validate-tp` gate: all TP strings in dialog must have Tatoeba pairs.

### V4 — Encounters + action-battle wiring
- `Encounters` object layer in `ma_tomo_lili.tmx`.
- `@rpgjs/action-battle` module wired to the main module.
- Wild encounter roll on tall-grass step.

### V5 — Capacitor Android build + CI
- `capacitor.config.ts` with `appId: com.pokisoweli.game`.
- GitHub Actions CI: pnpm install → validate → typecheck → build.
- Android APK as PR artifact.

### V6 — Full journey arc (7 regions)
- All 7 maps from `src/content/spine/journey.json`.
- All jan-lawa set-piece events.

## Locked design decisions

- **Creature-catching RPG.** Party of up to 6. Catch wild with **poki** (net). Five types: seli/telo/kasi/lete/wawa. Seven regions. Set-piece jan-lawa fights gate region boundaries. No player stats.
- **Green dragon is the final boss.** Only creature with a dedicated death animation. Never appears mid-game.
- **Fan-tasy is the only tileset family.** No mixing.
- **Tiled is the map authoring format.** `.tmx` → `tiledMapFolderPlugin` → `/map/<id>` at runtime.
- **Docs > tests > code.** Strict dependency chain.
- **No copyrighted references.** "lipu soweli" for catalog, "poki" for net, "jan lawa" for region masters.
- **No direct `localStorage` / `IndexedDB`** in feature code. Capacitor abstractions only.
- **Kid audience.** Dread knight not death knight. No permadeath.

## Context for the next session

1. Branch: `feat/rpgjs-v5-pivot`
2. Run `pnpm install && pnpm dev` to verify the dev server boots.
3. Next task: V2 — author `nasin_wan.tmx`, wire warp.
4. The Fan-tasy tileset TSX files live at `public/assets/tilesets/core/Tiled/Tilesets/`.
5. Memory at `~/.claude/projects/-Users-jbogaty-src-arcade-cabinet-toki-pona-tutor/memory/` has non-obvious rules.
