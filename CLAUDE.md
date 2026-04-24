---
title: Rivers Reckoning — Agent Entry Point
updated: 2026-04-24
status: current
---

# Rivers Reckoning

A cozy open-world creature-catching RPG. The player is Rivers, a kid who steps into a procedurally generated world and wanders indefinitely — catching creatures, building a party, talking to NPCs, taking optional challenges, spending gold at shops and inns. **No finite story, no badge gates, no final boss.**

**v2 is the current design.** v1 shipped a finite seven-beat story with four region masters and a green-dragon ending; that frame is retired. v1 remains preserved at tag `v1.0.0-final`. v2 work happens on the `v2-main` long-lived feature branch.

Repo path: clone-dependent; use `git rev-parse --show-toplevel` instead of assuming a fixed local path.

## Orient yourself

Before touching code, read these in order:

1. `docs/DESIGN.md` — product vision (what v2 IS and IS NOT).
2. `docs/ROADMAP.md` — v2 10-phase map; current phase status.
3. `docs/plans/rivers-reckoning-v2.prq.md` — full PRD with task IDs and acceptance criteria.
4. `docs/WORLD_GENERATION.md` — chunk grid, biome/village archetypes, adjacency rules, first-chunk Guide, seed-name generator.
5. `docs/ECONOMY.md` — universal reward function, tier-band scaling, XP curve, shop/inn pricing.
6. `docs/DIALOG_POOL.md` — role × context × mood × level-band schema, NPC realization.
7. `docs/QUESTS.md` — 10 challenge cause kinds, effect primitives, challenge lifecycle.
8. `docs/ARCHITECTURE.md` — stack layout (RPG.js v5 + Capacitor + vite + SQLite persistence).
9. `docs/BRAND.md`, `docs/UX.md`, `docs/TESTING.md` — visual, input, and testing rules (carried forward from v1).

Archived v1 creative docs: `docs/archive/v1-story/` — reference only; not authoritative.

Then: `git status && git log --oneline -10 && gh pr list`.

## Critical rules (override defaults)

-   **Docs > tests > code.** Docs describe the game; tests describe the code; code satisfies both. Never write tests to match code, and never write code without a doc-driven spec.
-   **Every monster is catchable.** Catching is the core verb. No species is locked out of the capture pod. Rare species exist but gate nothing.
-   **Determinism per seed.** Same seed + same player actions produce the same world. Never use `Math.random()` in world-gen; always route through the seeded PRNG factory.
-   **No finite gates.** No `badge_*` flags, no `proofs_all_four`, no `game_cleared`. No area refuses entry because of player level or flag state. Tier scaling is how difficulty gradients are expressed — the math in `docs/ECONOMY.md` is the contract.
-   **One universal reward function.** Every gold + item drop calls `reward()` in `src/modules/v2/reward-function.ts`. No second code path.
-   **Dialog pool, not per-NPC scripts.** NPC lines come from the role-keyed pool in `src/content/v2/dialog_pool/`. Per-NPC profiles are deterministic subsets of the pool. Never author lines tied to a specific hand-placed NPC.
-   **Challenges are optional.** Challenge → response → resolve. No chain, no gate, no story payoff. Resolve → gold + loot roll; NPC dialog shifts once to thanks, then degrades.
-   **Persistence via wrapper only.** Use `src/platform/persistence/preferences.ts` (small KV), `src/platform/persistence/database.ts` (SQLite), `src/modules/v2/chunk-store.ts` (chunk deltas). No direct `localStorage`/`IndexedDB` in feature code.
-   **Always use pull requests.** Work on branches under `v2-main`; don't push to `v2-main` or `main` directly. Never `--admin`.
-   **Mobile-first.** Tap-to-walk is primary input. Touch targets ≥ 44×44dp. HUD doesn't hide targets. Keyboard is a desktop shortcut.
-   **GitHub Actions pinned to exact SHAs.** Never `@vN` tags.
-   **No CDN at runtime.** Fonts, wasm, assets all self-hosted under `public/assets/`.
-   **No copyrighted / trademarked references** in docs, code, comments, or assets. The game is "Rivers Reckoning — a creature-catching RPG." Never compare to named franchises.
-   **Native English content.** No translation pipeline, no corpus, no toki-pona artifacts in new v2 code.
-   **Cozy dark-fantasy tone.** Skellies, goblins, wraiths — but never grim. Defeats are faints, not deaths. ≤ 20-word dialog lines. No condescension.

## Commands (v1-era, being rebuilt in v2)

```sh
pnpm install              # bootstrap
pnpm dev                  # vite dev server at http://localhost:5173/
pnpm typecheck            # split tsc surfaces
pnpm test:unit            # vitest build-time + pure-logic tests
pnpm test:integration     # real RPG.js engine in-process via @rpgjs/testing
pnpm test:e2e:smoke       # Playwright boot smoke
pnpm build                # vite build with prebuild gate
pnpm android:build-debug  # Capacitor debug APK
```

Playwright starts Vite on `127.0.0.1:5173` with `--strictPort`.

Build env for deploy targets:

```sh
GITHUB_PAGES=true pnpm build   # base='/poki-soweli/' for Pages (repo slug, not game name)
CAPACITOR=true    pnpm build   # base='./' for native WebView
# No env set → base='/' for dev/preview
```

v1 map-authoring commands (`pnpm author:*`) are scheduled for retirement in Phase 9 of the v2 work. They still run while v2 is under construction; artifacts remain in place until v2-main replaces them.

## Structure

v1 structure is preserved at `v1.0.0-final`. v2 adds:

```
src/
├── modules/
│   ├── main/             # v1 engine (frozen during v2 build)
│   └── v2/               # v2 engine (world-generator, chunk-store, reward, dialog, challenges)
└── content/
    ├── gameplay/         # v1 config JSON (frozen)
    ├── spine/            # v1 authored JSON (frozen)
    ├── regions/          # v1 dossiers (frozen, extractable to v2 pool)
    ├── generated/        # v1 compiled world.json (frozen)
    └── v2/               # v2 authoring surface (dialog_pool, names, challenges, economy config)

docs/
├── DESIGN.md             # v2 product spec
├── WORLD_GENERATION.md   # v2 world-gen spec
├── ECONOMY.md            # v2 economy spec
├── DIALOG_POOL.md        # v2 dialog spec
├── QUESTS.md             # v2 challenge spec
├── ROADMAP.md            # v2 phase map
└── archive/v1-story/     # v1 creative docs (reference)
```

## What NOT to do

-   Don't write v1-style hand-authored per-NPC dialog. Use the role pool.
-   Don't add `badge_*` / `proofs_*` / `game_cleared` / `green_dragon_defeated` flags to any new code.
-   Don't place NPCs by absolute `(x, y)` in any v2 module. NPC placement is realization-driven from `(seed, chunk_xy, spawn_idx)`.
-   Don't special-case the green dragon. In v2 it's a rare creature in far chunks, not a cutscene.
-   Don't introduce finite progression. No counting-down checklists, no "chapters complete," no ending.
-   Don't fork the reward function. One function, all sources.
-   Don't use `Math.random` in v2 world-gen. Always the seeded PRNG factory.
-   Don't edit archived v1 docs (`docs/archive/v1-story/*`) as if they're current. They're reference.

## Active context

- **Current phase**: 0 (spec lock) — specs being written, no code changes yet.
- **Current branch**: `docs/v2-phase-0-spec-lock` — merges to `main` when Phase 0 completes.
- **Next phase**: 1 (scaffolding) — create `v2-main`, stub modules, tag v1 final.
- **v1 shipped state**: `v1.0.0-final` (pending tag) on `main`. Pages deployment stable.

See `docs/ROADMAP.md` for the full phase map and `docs/plans/rivers-reckoning-v2.prq.md` for per-task detail.
