---
title: poki soweli — Extended Operating Protocols
updated: 2026-04-22
status: current
---

# Operating protocols for agents working on poki soweli

Companion to `CLAUDE.md`. CLAUDE.md is the quick-orient entry point; this file is the extended reference for how work happens here.

## Docs → Tests → Code (the one rule that matters most)

Strict dependency chain:

1. **Docs** describe what the game must be — product vision, acceptance criteria, UX spec, brand system.
2. **Tests** describe what the code must do to satisfy the docs.
3. **Code** satisfies docs and tests — the implementation of the contract, not the source of truth.

When tests fail, the question is "is the code wrong or is the test wrong?" — judged against the doc, not against the other. If a test contradicts the doc, the test is wrong. If the doc is silent on what the test asserts, the doc changes first, then the test, then the code.

When adding a feature, the first question is "what does the doc say this should do?" — if no doc answers, write the doc section before thinking about implementation.

## Stack

**RPG.js v5 beta** (`@rpgjs/server`, `@rpgjs/client`, `@rpgjs/common`, `@rpgjs/tiledmap`, `@rpgjs/action-battle`, `@rpgjs/ui-css`, `@rpgjs/vite`) runs on **CanvasEngine 2 beta** + **Pixi 8**. Save storage goes through **Capacitor 8** (`@capacitor/preferences` for KV, `@capacitor-community/sqlite` with `jeep-sqlite` + `sql.js` web shim for structured data).

The GUI layer is **RPG.js-native**: `.ce` (CanvasEngine) files for every custom HUD surface, registered via `defineModule<RpgClient>({ gui: [...] })`. No SolidJS, no Vue, no React. See `docs/UX.md`.

Typography is **self-hosted**: Nunito + Fredoka + JetBrains Mono + nasin-nanpa, all under SIL OFL 1.1, shipped as `.woff2` under `public/assets/fonts/`. No CDN at runtime.

## The content pipeline is load-bearing

Every piece of game content flows through this pipeline:

```
src/content/spine/<kind>/<id>.json   (hand-authored, EN strings tagged for TP resolution)
   ↓ scripts/build-spine.mjs
   ↓   validates Zod schemas
   ↓   resolves EN → canonical TP via src/content/corpus/tatoeba.json
   ↓ src/content/generated/world.json   (committed for reproducibility)
   ↓ src/modules/main/content.ts (runtime-guarded with assertContentWorld)
   ↓ player hooks, NPC events, gym-leader factories
```

Authors edit `spine/`, never `generated/`. `pnpm prebuild` runs the full pipeline and gates `pnpm build`. CI enforces it on every PR via `ci.yml` under the `unit` job.

Runtime gameplay catalogs live in `src/content/gameplay/*.json` and are validated by `src/content/gameplay/schema.ts`. Do not hardcode authored tables in RPG.js modules for map labels/safe spawns, runtime map events, starters, badges, party/save-slot limits, shop stock/NPC graphic/dialog/delivery target, battle rewards, level curves, trainer/final-boss battle stats/AI/rewards/death visuals, NG+ reset/scaling, daycare offspring tuning, gym XP/rematch tuning, type matchups, status-effect rules, wild-combat formulas, encounter timing, side quests, item-drop defaults, ambient weather/tint tables, combat chrome values, HP tiers/colors/labels, HUD/tap/combat UI IDs/timing/copy/retry tuning, lead movebar SP/cooldown/range tuning/copy/templates, sprite layouts, player/NPC/trainer/boss/effect manifests, BGM/SFX paths/volumes/selection/runtime timing/cue mapping, title/starter/pause/settings/inventory/save/vocabulary/party-panel/bestiary/quest journal/dialog fallback/defaults/SFX/shop/wild-encounter copy/choices/templates/dialog IDs, defeat/warp overlay ARIA/default phase copy, defeat revive dialog IDs, dictionary export text/SVG layout, notification templates/durations, save-position snap timing, or credits. TypeScript modules should consume the normalized exports from `src/content/gameplay/index.ts` and keep behavior separate from authored data.

Runtime event coordinates and warp target positions come from the compiled map-object layer in `src/content/generated/world.json`, not from hand-copied numbers in `server.ts` or `events.json`. If placement is wrong, fix the map spec or the intentional offset in `events.json`, then rebuild.

## Maps are build artifacts

The only way a map enters the repo is via a TypeScript spec in `scripts/map-authoring/specs/<id>.ts` built by `pnpm author:build <id>` (or `pnpm author:all`). `src/tiled/<id>.tmx` (runtime), `public/assets/maps/<id>.tmj` (archive), and `public/assets/maps/<id>.preview.png` (review PNG) regenerate from one spec.

`pnpm author:verify` runs in `pnpm validate` → `pnpm prebuild` → CI and fails on any hand-edited, orphaned, missing, or drifted `.tmx`/`.tmj`; `tests/build-time/map-preview-regression.test.ts` pixel-diffs preview PNG drift. **Never edit map artifacts by hand.** If the preview is wrong, edit the spec and rebuild.

## Asset pipeline

Every sprite in the game comes from the Fan-tasy tileset family. Mixing outside the allowlist introduces the tonal inconsistency that sank the previous playthrough.

| Category | Where |
|---|---|
| Tilesets (6 biomes) | `public/assets/tilesets/{core,seasons,snow,desert,fortress,indoor}/` |
| Player runtime sheets | `public/spritesheets/` |
| Bosses (animated, 1-of-a-kind) | `public/assets/bosses/` |
| Creatures (static, wild encounters) | `public/assets/creatures/` |
| NPCs (villagers, guards, warriors) | `public/assets/npcs/` |
| Combatants (rivals, gym leaders) | `public/assets/combatants/` |
| Effects | `public/assets/effects/` |
| Fonts | `public/assets/fonts/` |

Tiled `.tmx`/`.tsx` relative paths inside each tileset pack are preserved — open any source pack in the Tiled editor and it loads unchanged.

## Testing strategy

Five CI-gated layers plus the local full-browser suite, each doing one job well. Full spec in `docs/TESTING.md`.

| Layer | Lives in | Gate | Runtime |
|-------|----------|------|---------|
| Content pipeline | `scripts/validate-*.mjs`, `author:verify` | `pnpm validate` | Node |
| Type surface | split `tsc --noEmit` configs | `pnpm typecheck` | Node |
| Unit (pure logic) | `tests/build-time/`, vitest `unit` project | `pnpm test:unit` + coverage | Node |
| Integration (real engine) | `tests/integration/`, vitest `integration` project | `pnpm test:integration` | happy-dom + `@rpgjs/testing` |
| E2E smoke (real browser) | `tests/e2e/smoke/`, Playwright | `pnpm test:e2e:smoke` (CI) | Chromium + xvfb + GPU-ANGLE |
| E2E full (real browser) | `tests/e2e/`, Playwright | `pnpm test:e2e:full` (local) | Chromium + xvfb + GPU-ANGLE |

**Integration + E2E carry the weight.** Unit tests are reserved for pure-logic/math/formulas — algorithms that are expressible without the engine. Every feature that touches player-visible behavior ships with an integration test first, then E2E, then unit tests for any math that fell out along the way.

## Branching + PR discipline

- Work on feature branches; PR to `main`. Never push to `main`.
- Branch names are ephemeral — check `git branch --show-current` rather than assuming.
- Conventional Commits always (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`, `ci:`, `build:`, `perf:`).
- Squash-merge PRs.
- CI must be green before merge. Address every review comment.
- Never merge with `--admin`. Never bypass required-status-checks. Address all review-thread resolution.
- GitHub Actions are pinned to exact commit SHAs (latest stable). Dependabot-proposed `@vN` tag bumps get closed in favor of SHA pins.

## Deploy targets (three bases)

The same vite build produces three artifacts depending on where it's running:

```
base: './'              when CAPACITOR=true       (Android/iOS WebView)
base: '/poki-soweli/'   when GITHUB_PAGES=true    (Pages project subpath)
base: '/'               otherwise                 (local dev/preview)
```

Every CI build step that produces a deployable artifact sets the right env. See the `build`, `android-debug-apk` jobs in `.github/workflows/ci.yml` for the reference pattern.

## Persistence rules

- **Never `localStorage` or `IndexedDB` in feature code.** Use `src/platform/persistence/preferences.ts` (typed KV) or `src/platform/persistence/database.ts` (structured SQLite) — Capacitor-backed with web shims inside the wrapper only.
- **Save schema changes bump `DB_VERSION`** in `database.ts` and add a migration step in `migrateSchema()`. `PRAGMA user_version` is the canonical version source.
- **Autosave** fires on map change, combat end, and quit intent. Manual save (slots 1-3) lands via the pause-menu Save row.

## Languages + formats

- **TypeScript strict** for all game code.
- **`.ce`** for CanvasEngine GUI components. Reactive signals, native mouse + touch events. See `docs/UX.md` + https://canvasengine.net/llms.txt for the component model.
- **JSON** for content (Zod-validated).
- **Tiled `.tmx`/`.tsx`** for tilemaps — but `.tmx` under `src/tiled/` and `.tmj` under `public/assets/maps/` are **emitted artifacts**, never hand-edited.

## When something fights you

- **`pnpm author:verify` fails** — the `.tmx`/`.tmj` on disk drifted from the spec (or is orphaned, or missing). DO NOT edit artifacts directly. Edit the spec under `scripts/map-authoring/specs/` and re-run `pnpm author:build <id>`. If orphaned, remove the `.tmx`/`.tmj` or add the matching spec.
- **`pnpm validate-tp` rejects a line** — rewrite the EN, never hand-author TP. See `docs/WRITING_RULES.md`.
- **`tsc` fails on a `@rpgjs/*` type** — upstream ships named exports as `default` only in several packages. Add a shim under `src/types/rpgjs-*.d.ts` mirroring the runtime surface. The typecheck script already filters one known upstream bug (`@rpgjs/common/rooms/WorldMaps.ts`) via pipefail grep.
- **Dev server shows blank canvas / tilemap doesn't render** — check the vite `base` matches how you're requesting the URL (dev = `/`, not `/poki-soweli/`). The tilemap plugin prefixes requests with `${base}map`.
- **Font 404 on deployed Pages** — make sure the CI build step has `GITHUB_PAGES=true` so vite rewrites `/assets/fonts/...` to `/poki-soweli/assets/fonts/...`.
- **Integration test hangs** — waiting for a map change or tick that never fires. Lower the `waitForMapChange` timeout to get a clean error, then call `fixture.nextTick()` explicitly. The engine doesn't tick on its own in tests.

## What's unique about this game (design constraints)

- **Player has no stats.** The party of ≤ 6 creatures is the character sheet.
- **Five creature types**: seli (fire) / telo (water) / kasi (plant) / lete (ice) / wawa (strong). Each has specific matchup multipliers; wawa is the neutral bruiser.
- **Every monster is catchable.** Tiering is rarity + catch difficulty + animation depth — not whether the poki works.
- **No translation UI.** Vocabulary is picked up diegetically through play. The player never sees an English gloss dictionary.
- **Seven regions → four current `jan lawa` → one final boss (green dragon).** Green dragon is the only creature with a dedicated death animation; the final-boss defeat path plays it, and the species is also a rare final-route catch.
- **Kid audience.** "Dread knight" > "death knight". Tone is fierce-but-friendly, never punishing, no permadeath.
- **Mobile-first.** Tap-to-walk primary, keyboard as desktop shortcut, no orientation lock, responsive via container queries, safe-area-aware.
- **No trademarked references** in any doc, code, comment, or asset. The game is a "creature-catching RPG" — never compared to any specific franchise by name.
