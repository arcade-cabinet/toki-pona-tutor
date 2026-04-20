---
title: Current State
updated: 2026-04-20
status: current
domain: context
---

# Where we are

**Branch:** `feat/rpgjs-v5-pivot` → PR #66 (149 commits ahead of `main`, about to squash-merge into `v0.2.0` release train).

**Stack:** RPG.js v5 beta + CanvasEngine/Pixi 8 + Capacitor 8 persistence + Tiled (`.tmx` built from TS specs) + vendored Tatoeba corpus. See `docs/ARCHITECTURE.md`.

**Base URL:** `/poki-soweli/` on web (GitHub Pages), `/` under Capacitor (see `vite.config.ts`). Dev server boots at `http://localhost:5173/poki-soweli/` — watch the vite output if 5173 is taken, the port auto-increments.

## Orient yourself

Read these in order before touching code:

1. **`docs/ROADMAP.md`** — single source of truth for what's done, what's next, and the Definition of Done for `v0.2.0`.
2. **`docs/ARCHITECTURE.md`** — stack layout + the three layers (content pipeline → pure game modules → runtime wiring).
3. **`docs/TESTING.md`** — the E2E-first testing rule: every feature ships with an integration test that exercises the real engine before any unit test.
4. **`docs/DESIGN.md`** — product vision (what the game IS and IS NOT).
5. **`docs/BRAND.md`** — palette, typography, chrome patterns. All UI surfaces draw from these tokens.

Then: `git status && git log --oneline -10 && gh pr view 66`.

## Running the game

```sh
pnpm install
pnpm dev                 # http://localhost:5173/poki-soweli/
pnpm test                # both projects (unit + integration)
pnpm test:unit           # pure-logic only (~5 s)
pnpm test:integration    # real RPG.js engine in Node via @rpgjs/testing
pnpm test:coverage       # unit coverage gate, 95% lines/95% functions/90% branches
pnpm build               # prebuild (validate + build-spine + typecheck) → vite build
pnpm preview             # serve the built bundle
```

## Playtest the real game, not just the tests

Tests catch regressions in behavior the tests already asserted. Whether the game is **fun** only reveals itself in a browser. Before merging any feature that touches player-visible behavior, run `pnpm dev` and walk it yourself. Screenshots and a sentence in the PR description are better than a ticked checkbox.

## Hard rules (override defaults)

- **Fan-tasy is the only tileset family.** `public/assets/tilesets/{core,seasons,snow,desert,fortress,indoor}/` is the source of truth.
- **Maps are build artifacts.** Edit `scripts/map-authoring/specs/<id>.ts`, run `pnpm author:build <id>`. Never edit `src/tiled/*.tmx` or `public/assets/maps/*.tmj` directly. `pnpm author:verify` enforces this in `validate` + `prebuild` + CI.
- **Every monster is catchable.** Tiering is rarity + catch difficulty, not whether `poki` works. Green dragon (`akesi_sewi`) is the final boss, the only creature with a death animation.
- **No hand-authored toki pona.** Every user-facing TP string round-trips through the Tatoeba corpus. `pnpm validate-tp` is the gate. If it rejects, rewrite the EN.
- **No direct `localStorage` / `IndexedDB`** in feature code — `src/platform/persistence/preferences.ts` (KV) or `src/platform/persistence/database.ts` (structured) only.
- **Docs > tests > code.** Docs describe the game; tests describe the code; code satisfies both. Tests never chase code.
- **E2E > unit.** Integration tests with the real engine carry the weight. Pure-logic unit tests are for algorithms, nothing else. See `docs/TESTING.md`.
- **Always use pull requests.** Never push to `main` directly.

## What landed in this branch

PR #66 is the RPG.js v5 pivot plus roughly half of the `v0.2.0` backlog. For a precise accounting of done / partial / open tasks, read `docs/ROADMAP.md`. For commit-level history, `git log main..HEAD --oneline`.

Short version:

- **Phase 1 (playable vertical slice)** — done.
- **Phase 2 (combat polish + party)** — pure-logic modules + pure helpers done (victory sequence, HP thresholds, party order, type matchup, xp curve, catch math, status effects). Runtime wiring of animated combat UI is open.
- **Phase 3 (save, menus, transitions)** — autosave, continue, settings screen, pause menu, save-schema migrations done. Title scene + credits open.
- **Phase 4 (content breadth)** — 7 maps walkable, 4 gym set-pieces wired, bestiary state machine done, 17-species roster content still partial on per-biome paint.
- **Phase 5 (audio / mobile / a11y)** — BGM selection, SFX catalog, virtual d-pad math, settings sliders done. Actual Howler runtime + portrait-lock + mobile overlay open.
- **Phase 6 (release hardening)** — CI/CD trifecta wired, commitlint, bundle-size audit, unit coverage gate, save round-trip, warp-graph topology, dialog content cross-check done. E2E playthrough open (now that the hand-rolled harness is replaced by `@rpgjs/testing`, this is the next big push).
- **Phase 7 (post-v0.2 depth)** — pure-logic scaffolding for NG+, daycare, ambient events, side quests, status effects, treasure chests, rematches done.
- **Phase 8 (language layer)** — sentence log, sitelen-glyph helper, micro-game seed logic, dictionary-export done. Settings flag wired for the "show sitelen overlay" toggle.
- **Phase 9 (engine perf / infra)** — unit coverage gate live at 95%/95%/90%/95%.
- **BRAND** — `docs/BRAND.md` + `src/styles/brand.css` + boot wiring + reactive high-contrast toggle live. Settings pause menu is the first surface rendering the theme.

## Testing posture

Two vitest projects share one config:

- **unit** (`tests/build-time/`, 522 tests) — Node env, pure logic only, coverage-gated at 95% lines.
- **integration** (`tests/integration/`, 1 test so far) — happy-dom + `@rpgjs/testing/dist/setup.js`, boots the real `@rpgjs/server` + client in-process, exercises the same module graph as `src/standalone.ts`. This is where all new feature tests land.

The old `tests/e2e/` hand-rolled vitest-browser + Playwright harness was replaced in commit `6992c10` because `@rpgjs/testing` does the same job without a browser runtime — same engine, same wiring, no socket, no chromium, faster CI.

## Known limits

- **Integration suite is thin.** `boot.test.ts` proves the player connects and lands on `ma_tomo_lili`. Starter ceremony, warp flow, encounter, catch, respawn all still need integration tests. This is the next priority.
- **RPG.js v5 is beta.** `5.0.0-beta.1` across all `@rpgjs/*` packages. API churn is still possible; see `docs/ROADMAP.md` risk list.
- **`@rpgjs/common/src/rooms/WorldMaps.ts`** ships with a known type error; `pnpm typecheck` filters it via pipefail grep. Revisit when v5 goes stable.
