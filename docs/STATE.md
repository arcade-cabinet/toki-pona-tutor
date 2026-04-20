---
title: Current State
updated: 2026-04-20
status: current
domain: context
---

# Where we are — 2026-04-20

**RPG.js v5 pivot, V1–V7 landed.** PR #66 on branch `feat/rpgjs-v5-pivot` is ~13 commits ahead of `main`: the full starter scaffold plus content spine, gated map warps, wild-encounter capture, mastered-words tracking, pause-menu vocab, and the first action-battle set-piece (jan Ike rival).

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

## Landed since pivot scaffold (PR #66 commit trail)

### V1 — Journey schema port (`d466c90`)
Cherry-picked `src/content/schema/journey.ts`, `spine/journey.json`, `build-spine.mjs` changes from the closed `feat/l3-journey` branch. Deleted obsolete region schema + spine JSONs. `world.journey.beats` is now the ordered arc.

### V2 — jan Sewi starter ceremony (`72568a5`)
`src/modules/main/starter-ceremony.ts` fires on `jan-sewi.onAction`. Reads Tatoeba-gated dialog from `spine/dialog/jan_sewi_starter.json` + `jan_sewi_after_pick.json`. Choice (soweli seli / soweli telo / kasi pona) writes `KEYS.starterChosen` preference + SQLite `flags.starter_chosen`, seeds mastered_words with the starter's root words. `scripts/build-spine.mjs` now emits collected dialog nodes into `world.json` (previously dropped).

### V3a — Map pipeline enforcement (`684b458`)
`scripts/map-authoring/lib/tmx-emitter.ts` serialises TmjMap→.tmx. `author:build` emits both `.tmj` (public/) and `.tmx` (src/tiled/) from one spec. New `scripts/map-authoring/cli/verify.ts` runs in `pnpm validate` → `pnpm prebuild` → CI and fails on any hand-edited, orphaned, or drifted `.tmx`. CLAUDE.md + STANDARDS.md + AGENTS.md document the "maps are build artifacts" rule; memory entry added.

### V3 — Gated multi-map warps (`6b888a3`)
`src/modules/main/warp.ts` factory reads Tiled object coords, checks a SQLite flag, optionally replays a gated dialog node, and on pass calls `player.changeMap` + persists `KEYS.currentMapId` for quick-resume. Wired on both maps: `ma_tomo_lili.warp_east → nasin_wan` (gated `starter_chosen`) and `nasin_wan.warp_east → nena_sewi` (gated `jan_ike_defeated`).

### V4 — Wild encounter + poki capture (`657ec52`)
`src/modules/main/encounter.ts` hooks `onInShape` for shapes named `encounter_*`. 12% trigger, weighted species roll from the shape's `species` JSON property, level band from `level_min`/`level_max`, `player.showChoices('?', ['poki', 'tawa'])`. Catch success = `Math.random() < species.catch_rate` → `addToParty` + log. `party_roster` + `encounter_log` SQLite tables. Three Tatoeba-gated encounter dialogs. Action-battle deferred to V7.

### V5 — Mastered-words tokenizer + pause vocab (`bad5a16`)
`src/modules/main/vocabulary.ts` tokenises every TP dialog line against `src/content/dictionary.json` (131 words). `src/modules/main/dialog.ts` is now the single `playDialog` chokepoint that calls `observeTpLine` for every beat. Pause key (`escape`) opens `src/modules/main/vocabulary-screen.ts` which pages through mastered words (sightings ≥ 3) with definitions via `showText` — no Vue GUI needed.

### V6 — PR #66 review fixes (6 commits, `850da57`..`af32aca`)
37 CodeRabbit + Copilot comments resolved. Highlights: `copyWasmPlugin` for sql.js wasm → `public/assets/`, CSS imports routed through TS so Vite bundles them, typecheck script preserves tsc exit code via pipefail, `CapacitorSaveStorageStrategy` gains index-validation + corrupted-payload detection, `webReadyPromise` resets on failure, `localStorage.clear` scoped to poki-soweli keys, Windows path normalisation in build-spine, start_region_id cross-validated against first journey beat, green-dragon enforcement guard, tmx-emitter round-trips visible/opacity/rotation, nasin_wan warp y-coord corrected, explicit `image-size` devDep. Orphan `koota-gen.ts` removed.

### V7 — jan Ike rival action-battle (`9e09d77`)
`src/modules/main/jan-ike.ts` creates an aggressive `BattleAi` event (HP 60, ATK 14, PDEF 8, vision 140, no flee). `onDefeated` sets SQLite `jan_ike_defeated` flag + plays victory dialog + advances `KEYS.journeyBeat`. `provideActionBattle()` wired server-side (`src/server.ts` from `/server` subpath) and client-side (`config.client.ts` from `/client` subpath) — the package's root export resolves to the client bundle which pulls canvasengine (top-level `window` access) and crashes vite config loading; subpath imports are load-bearing. Type shim declared in `src/types/rpgjs-tiledmap.d.ts`. `docs/COMBAT.md` documents the full pattern for future gym leaders.

### CI hygiene (`7573304`)
Added missing devDeps `canvas` + `pngjs` + `@types/pngjs`, added `canvas` to `pnpm.onlyBuiltDependencies` for its native build, and split `verify.ts` imports to dodge the renderer module graph so CI's `author:verify` stays off the canvas dep path.

## Next layers (queued for V8+)

### V8 — first gym leader (jan Wawa, beat 3)
- Edit `scripts/map-authoring/specs/nena_sewi.ts` to add encounter zones,
  then run `pnpm author:build nena_sewi` to regenerate `src/tiled/nena_sewi.tmx`
  and `public/assets/maps/nena_sewi.tmj`. Commit both the spec and the
  regenerated files. (`src/tiled/*.tmx` are build artifacts — never edit them directly.)
- `jan_wawa` event: two-creature fight (`waso_sewi` L8 → `soweli_lete` L10). First gym-leader pattern using `BattleAi` phase-transitions.
- `onDefeated` sets `badge_sewi` flag + advances journey beat + grants the reward word `sewi` (mastery bump).

### V9 — loss/retry path
When the player's HP hits 0 in an action-battle, RPG.js default is undefined. Hook a game-over callback that restores the player at the last village's spawn + preserves party state. This needs to land before the first fight the player might realistically lose (jan_wawa).

### V10 — Capacitor Android shell
- `capacitor.config.ts` with `appId: com.pokisoweli.game`.
- CI job to build + upload the debug APK as a PR artifact on every push.

### V11–V15 — remaining journey beats (ma_telo, ma_lete, nena_suli, nasin_pi_telo, endgame)
- Each follows the V8 pattern: edit `scripts/map-authoring/specs/<id>.ts`,
  run `pnpm author:build <id>`, commit spec + regenerated `.tmx`/`.tmj`.
  Never edit `.tmx` files directly — they are build artifacts.
- Final beat: green-dragon cutscene + unique death animation.

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

1. Branch: `feat/rpgjs-v5-pivot` → PR #66. CI run on `7573304` in progress.
2. Run `pnpm install && pnpm dev` to verify the dev server boots (vite+rpgjs ready at `http://localhost:5173/toki-pona-tutor/`).
3. Before touching any `.tmx`: edit `scripts/map-authoring/specs/<id>.ts` and run `pnpm author:build <id>`. `pnpm author:verify` is the enforcement gate.
4. Before touching any dialog: author EN in `src/content/spine/dialog/<id>.json` and run `pnpm validate-tp` — every line must match a Tatoeba pair.
5. Next task: V8 — jan Wawa gym (beat 3). First gym-leader pattern.
6. Fan-tasy tileset TSX files live at `public/assets/tilesets/core/Tiled/Tilesets/`.
5. Non-obvious assistant memory rules are documented in `docs/ASSISTANT_MEMORY.md` rather than referencing machine-local paths.
