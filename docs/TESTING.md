---
title: Testing Strategy
updated: 2026-04-20
status: current
domain: quality
---

# Testing Strategy

poki soweli has **four test layers**, ordered by scope. Each serves a
distinct failure class; none is a substitute for another.

| Layer | Lives in | Gate | Runtime |
|-------|----------|------|---------|
| **1. Content pipeline** | `scripts/validate-*.mjs`, `author:verify` | `pnpm validate` in CI | Node |
| **2. Type surface** | `tsc --noEmit` across `src/`, `scripts/`, `tests/` | `pnpm typecheck` in CI | Node |
| **3. Build-time unit tests** | `tests/build-time/` | `pnpm test:build-time` (local; CI pending) | Vitest (Node) |
| **4. End-to-end browser smoke** | `tests/e2e/` | `pnpm test:e2e` (local; CI pending) | Vitest + Playwright |

## Layer 1 — Content pipeline

The cheapest catch. Runs in under a second.

- **`pnpm validate-challenges`** — static challenge data against the 131-word dictionary.
- **`pnpm validate-tp`** — every multi-word translatable string in `src/content/spine/**` must round-trip through the vendored Tatoeba corpus. Hand-authored TP cannot ship.
- **`pnpm author:verify`** — the map-authoring contract gate. Fails when any `src/tiled/*.tmx` is orphaned, missing, or drifts from its `scripts/map-authoring/specs/<id>.ts`.
- **`pnpm build-spine`** — compiles `spine/*.json` into `generated/world.json` with Zod schema checks + green-dragon-only-in-final-beat enforcement.

This layer is the `pnpm validate` composite and runs on every PR via `ci.yml`.

## Layer 2 — Type surface

`tsc --noEmit` with a filter that strips one known-upstream error
(`@rpgjs/common/src/rooms/WorldMaps.ts`, a beta package bug we can't
fix). Runs on every PR.

What it catches:
- Missing exports / renamed APIs as `@rpgjs/*` packages move.
- Shape mismatches between content JSON and the Zod-derived types.
- Capacitor persistence method signatures — the sqlite plugin's `Changes` shape etc.
- The `event.setGraphic?.(...)` discipline — runtime-optional methods must be called behind optional-chaining, not cast-away.

What it doesn't catch:
- Logic errors (unit tests own this).
- Anything that runs only in a real browser (E2E owns this).

## Layer 3 — Build-time unit tests

`tests/build-time/` — Vitest-in-Node. Currently covers the
map-authoring toolchain (`parser`, `palette`, `emitter`, `renderer`)
and the content-pipeline validators.

Run: `pnpm test:build-time`

Coverage goals (current):
- ✅ Map authoring: parser, emitter, renderer, validator all have per-shape assertions.
- ✅ Palette name resolution + tsx-qualified-key disambiguation.
- ⚠️  Content-pipeline scripts (`validate-tp`, `build-spine`, `validate-challenges`) are tested implicitly via CI but have no explicit Node-level specs. Adding snapshot-style specs is a follow-up.
- ❌ No tests for the Capacitor persistence adapters yet. `CapacitorSaveStorageStrategy`'s sparse-array handling, `addToParty`'s 6-slot cap, migration-script idempotency — these all need specs before shipping a release.

Not yet wired in CI. Will be when we cut v0.2.0.

## Layer 4 — End-to-end browser smoke

`tests/e2e/` — Vitest browser mode + Playwright-driven Chromium.
The harness dynamically imports `src/standalone.ts` inside a real
browser context and polls for CanvasEngine's canvas to mount.

What it asserts today (V18):
- The RPG.js v5 build boots without throwing.
- The canvas element appears in the DOM within 15 seconds.

What's `it.todo` pending RPG.js v5 exposing a stable inspector (the
client engine doesn't currently attach a `window.__rpgjs__` we can
introspect):
- Player walks one tile east.
- Interacting with jan Sewi opens the starter-ceremony dialog.
- Selecting a starter sets the flag + opens the east warp.
- Capture success writes to `party_roster`.
- Defeat at HP 0 respawns at the last village.

Run: `pnpm test:e2e`

Not yet wired in CI. The smoke assertion is enough to catch
module-resolution / Vite-config / dep-graph regressions; gameplay
coverage depends on the inspector shape.

## Manual + playtest

Some bugs only surface under a human hand:

- **Dialog pacing.** Does the starter-ceremony timing feel ceremonial, or rushed?
- **Encounter density.** Is 12% per tall-grass tile too chatty? Too sparse?
- **Gym fight difficulty.** Phase-1/phase-2 HP ratios need real play to tune.
- **Respawn loop warmth.** "You seem well..." plus map change — is it welcoming or jarring?

Trackable via session notes. No automation substitutes here.

## Testing the map-authoring toolchain

The toolchain has its own mini-harness under `tests/build-time/` —
parser round-trips, emitter golden-file diffs, renderer PNG pixel
checks. Because maps are build artifacts (per STANDARDS.md), these
tests are the primary regression signal for the pipeline. Adding
a new palette entry or changing the emitter's XML output should
start by updating or adding a test in this directory.

## When something fails

- **`validate-tp` rejects a line** — rewrite the EN to match a canonical Tatoeba pair. Never hand-author TP.
- **`author:verify` flags drift** — `pnpm author:build <id>` regenerates the artifact from the spec. Never edit the `.tmx` directly.
- **`tsc` fails on a `@rpgjs/*` type** — check if the package ships named exports as `default` only (common beta pattern). Add a shim in `src/types/rpgjs-*.d.ts` mirroring the runtime surface.
- **E2E boot fails** — check `pnpm dev` locally first. The e2e harness loads the same module graph Vite loads.

## Adding tests

**Build-time (Node):** drop `tests/build-time/<subject>.test.ts`.
Import the pure functions directly; no browser context. Fast.

**E2E (browser):** drop `tests/e2e/<feature>.test.ts` + a matching
harness in `tests/e2e/harness/`. Expect to hit the inspector
limitation until RPG.js v5 matures; use `it.todo` with a clear
unblock pointer rather than fragile DOM-polling workarounds.

## Docs → Tests → Code dependency chain

This repo's rule: **docs describe the game, tests describe the
code, code satisfies both**. If a test asserts behavior that no
doc motivates, the doc is wrong and must land first. If a doc
specifies behavior that no test covers, write the test before
implementing. Never write code that doesn't trace back through a
test to a doc.

`pnpm validate-tp` embodies this: it reads `src/content/spine/`
against the corpus. If the corpus can't satisfy an EN line, the
rule (per `docs/WRITING_RULES.md`) is to rewrite the EN — you're
not allowed to satisfy the test by hand-crafting TP. The docs
always win.
