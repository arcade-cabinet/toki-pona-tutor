---
title: Setup
updated: 2026-04-20
status: current
domain: ops
---

# poki soweli — contributor setup

Fresh clone → running dev server in under five minutes.

## Prerequisites

- **Node 22+** (LTS) — enforce via `corepack enable`
- **pnpm 10+** — `npm install -g pnpm` or corepack
- **Git 2.40+** with LFS for binary assets (`git lfs install` once per machine)

Optional:
- **Tiled editor** — for *inspecting* `.tmx` maps (authoring is spec-based; Tiled is read-only here)
- **Android SDK 34 + Java 21 Temurin** — only needed if you're building APKs locally (CI handles the release builds)

## First-run bootstrap

```sh
git clone git@github.com:arcade-cabinet/poki-soweli.git
cd poki-soweli
pnpm install
pnpm dev
```

`pnpm dev` opens a Vite server at http://localhost:5173 in RPG.js v5 standalone mode (client + server in one process). No separate backend.

## Validating your changes

The three commands you'll run most often:

```sh
pnpm validate    # content-pipeline gate (validate-challenges + validate-tp + author:verify)
pnpm typecheck   # tsc --noEmit across src/ and tests/
pnpm build       # prebuild (validate + build-spine + typecheck) then vite build
```

`pnpm validate` runs in CI on every PR; CI failure here almost always maps to a local `pnpm validate` rerun reproducing the error.

## The content pipeline

Maps and species are **build artifacts**, not hand-edited files. The source of truth is:

- **Maps:** `scripts/map-authoring/specs/<id>.ts` → `pnpm author:build <id>` or `pnpm author:all --all` → emits `src/tiled/<id>.tmx` + `public/assets/maps/<id>.tmj` + preview PNG.
- **Species / moves / items / dialog / journey:** `src/content/spine/**/*.json` → `pnpm build-spine` → emits `src/content/generated/world.json`.
- **Toki Pona strings:** every multi-word `en` field on a translatable goes through the Tatoeba corpus at `src/content/corpus/tatoeba.json`. If `pnpm validate-tp` rejects your sentence, **rewrite the EN, don't hand-author the TP**.

See `docs/ARCHITECTURE.md` for the full shape.

## Sprite curation

When adding or updating a sprite sheet under `public/assets/`, follow `docs/SPRITE_CURATION.md`. Every sheet is hand-inspected once; no scripting, no auto-grid detection. The rat (`soweli_jaki`) is the worked reference.

## Running tests

```sh
npx vitest run tests/build-time/      # fast unit tests (catch-math, xp-curve, type-matchup, encounter-roll, schema-load)
npx vitest run tests/e2e/             # browser E2E — currently scaffolding; mostly todo until V5-01 inspector
```

## Common gotchas

- **`sqlite` peer-dep warning on install:** `@capacitor-community/sqlite@6` pins `@capacitor/core@^6` but we're on `@capacitor/core@8`. pnpm tolerates this; npm doesn't. If you see `ERESOLVE` errors, you're running `npm install` instead of `pnpm install`.
- **Dev server fails with `window is not defined` at startup:** you imported from `@rpgjs/action-battle` directly instead of `/server` or `/client` subpath. See `src/types/rpgjs-tiledmap.d.ts`.
- **`pnpm typecheck` filters `@rpgjs/common/src/rooms/WorldMaps.ts`:** that's an upstream TS bug; our grep in the typecheck script hides it. Don't remove the filter.

## Worktrees for parallel agent work

Long-lived feature branches live under `.worktrees/<branch-name>/`. Spawn one with:

```sh
git worktree add .worktrees/my-feature -b feat/my-feature
cd .worktrees/my-feature
pnpm install   # first time only per worktree (pnpm uses hardlinks from the root node_modules)
```

This lets multiple Claude agents work on orthogonal branches without stomping on each other's file state.

## Next

- Read `CLAUDE.md` for the critical rules (Fan-tasy only, no hand-authored TP, every monster catchable, maps are build artifacts).
- Read `docs/STATE.md` for what just landed and what's queued.
- Read `docs/ROADMAP.md` for the full phase backlog.
