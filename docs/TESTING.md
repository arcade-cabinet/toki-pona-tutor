---
title: Testing Strategy
updated: 2026-04-20
status: current
domain: quality
---

# Testing Strategy

## The rule: integration > unit

**Unit tests catch regressions in algorithms. Integration tests catch regressions in the game.** Unit tests alone don't prove anything you can't already verify by reading pure functions. Every feature that touches player-visible behavior ships with an integration test that boots the real engine first. Unit tests are reserved for what they're actually good at: pure-logic + math + formulas.

Concretely:

- Authoring a new NPC? Integration test: create client, walk next to the NPC, call `onAction`, assert the dialog fires.
- Authoring a new pure helper (HP threshold, move damage formula)? Unit test the math, then wire it into a component and add an integration test for the component.
- Changing a map warp? Integration test: walk across the warp, assert `getCurrentMap()` changed.

When a bug is reported, it goes in the integration suite first and the fix has to make the new test pass. If the bug can be expressed without the engine, it also gets a unit test — but the integration test is the one that proves the user-facing behavior is fixed.

## Four layers, one rule each

| Layer | Lives in | Gate | Runtime |
|-------|----------|------|---------|
| **1. Content pipeline** | `scripts/validate-*.mjs`, `author:verify` | `pnpm validate` in CI | Node |
| **2. Type surface** | `tsc --noEmit` across `src/`, `scripts/`, `tests/` | `pnpm typecheck` in CI | Node |
| **3. Unit (pure logic)** | `tests/build-time/`, vitest `unit` project | `pnpm test:unit` + coverage in CI | Node |
| **4. Integration (real engine)** | `tests/integration/`, vitest `integration` project | `pnpm test:integration` in CI | happy-dom + `@rpgjs/testing` |

## Layer 1 — Content pipeline

The cheapest catch. Runs in under a second.

- `pnpm validate-challenges` — static challenge data against the 131-word dictionary.
- `pnpm validate-tp` — every multi-word translatable string in `src/content/spine/**` must round-trip through the vendored Tatoeba corpus. Hand-authored TP cannot ship.
- `pnpm author:verify` — the map-authoring contract gate. Fails when any `src/tiled/*.tmx` is orphaned, missing, or drifts from its spec.
- `pnpm build-spine` — compiles `spine/*.json` into `generated/world.json` with Zod schema checks + green-dragon-only-in-final-beat enforcement.

Runs on every PR via `ci.yml` under the `unit` job before the vitest suite.

## Layer 2 — Type surface

`tsc --noEmit` with a pipefail-based grep that strips one known upstream bug (`@rpgjs/common/src/rooms/WorldMaps.ts`). Runs on every PR.

Catches: missing exports as `@rpgjs/*` packages churn, content-JSON shape drift, Capacitor plugin signature shifts, `event.setGraphic?.(...)` discipline.

Does **not** catch: logic errors (unit tests own this), in-engine state (integration owns this).

## Layer 3 — Unit (pure logic)

`tests/build-time/` — Vitest in Node, pure functions only. Covered by the `unit` project in `vitest.config.ts`.

```sh
pnpm test:unit          # run once
pnpm test:watch         # watch both projects
pnpm test:coverage      # unit + v8 coverage + ratchet check
```

**Coverage gate:** 95% lines / 95% functions / 90% branches / 95% statements on the scoped include list (pure-logic modules only — platform adapters and runtime wiring are integration-tested, not coverage-measured). See `vitest.config.ts` → `coverage.include`.

**What belongs in unit:** XP curves, catch math, type matchup, status effects, RNG seeds, ordering/serialization helpers, color-tier thresholds, the bestiary state machine, party-slot reordering, sentence-log querying, sfx event→volume maps. Anything a pure function can express.

**What does NOT belong in unit:** anything that needs the engine to observe (player position after an input, dialog firing, map change, save round-trip). Those go in integration.

## Layer 4 — Integration (real engine)

`tests/integration/` — Vitest in happy-dom with `@rpgjs/testing/dist/setup.js` loaded. Uses `@rpgjs/testing`'s `testing(modules)` fixture, which instantiates both server and client in-process (standalone mode, same wiring as `src/standalone.ts`), wires a mock `LoadMap` provider so no vite dev server is needed, and returns a `createClient()` factory that gives you a real `RpgPlayer` + `RpgClientEngine`.

```sh
pnpm test:integration
```

Config (excerpt from `vitest.config.ts`):

```ts
{
    name: 'integration',
    include: ['tests/integration/**/*.test.ts'],
    environment: 'happy-dom',
    setupFiles: ['@rpgjs/testing/dist/setup.js'],
    // RPG.js singletons — one file at a time.
    fileParallelism: false,
}
```

### Template

```ts
import { describe, it, expect, afterEach } from 'vitest';
import { testing, clear } from '@rpgjs/testing';
import server from '../../src/modules/main/server';

afterEach(async () => {
    await clear();
});

describe('<feature>', () => {
    it('<behavior>', async () => {
        const fixture = await testing([{ server }]);
        const client = await fixture.createClient();

        // Wait for onConnected → starter map.
        const player = await client.waitForMapChange('ma_tomo_lili');

        // Drive the game...
        // Assert observable state.
        expect(player.x()).toBe(128);
    });
});
```

### The fixture API

From `@rpgjs/testing` beta-1:

- `testing(modules, clientConfig?, serverConfig?)` — boot the in-process server + client and return a fixture.
- `fixture.createClient()` → `{ socket, client, playerId, player, waitForMapChange(mapId, timeout?) }`.
- `fixture.nextTick(timestamp?)` — advance physics + sync by one tick.
- `fixture.nextTickTimes(n, timestamp?)` — loop of the above.
- `fixture.wait(ms)` / `fixture.waitUntil(promise)` — time-based waiting.
- `fixture.clear()` — reset state (call in `afterEach`).

Prefer `waitForMapChange` over raw tick loops when the behavior is "something moved us to a new map." Prefer `nextTick` when you need to let physics/collision/encounter rolls evaluate.

### What's covered today

One test:

- `tests/integration/boot.test.ts` — the floor. Player connects, `onConnected` runs, lands on `ma_tomo_lili` at (128, 128).

### What's coming next (priority order)

1. Starter ceremony: interact with `jan-sewi`, pick one of three starters, assert flag + mastered-words seeded + warp opens.
2. Warp flow: walk to `warp_east` on `ma_tomo_lili`, assert map change to `nasin_wan` + player at expected spawn.
3. Wild encounter: step onto an `encounter_*` shape, assert choice prompt opens, pick `poki`, assert capture roll + `party_roster` update.
4. jan Ike rival: trigger action-battle, assert AI engages, simulate victory, assert `jan_ike_defeated` flag + journey beat advance.
5. Respawn: simulate player faint, assert return to last village at full HP.
6. Save round-trip: save state mid-session, `clear()`, reload, assert every field is restored.

Everything above ships **before** we tag `v0.2.0`.

## Visual verification

Tests prove behavior didn't regress. They don't prove the game looks right. Before marking any UI-touching PR ready for review:

1. `pnpm dev` locally.
2. Click through the feature you just changed.
3. Screenshot the result.
4. Paste in the PR description with a one-sentence description of what changed visually.

The unit tests and the integration suite have no opinion on whether the HP bar color gradient pleases the eye. You do.

## Testing the map-authoring toolchain

The toolchain has its own mini-harness under `tests/build-time/` — parser round-trips, emitter golden-file diffs, renderer PNG pixel checks. Because maps are build artifacts (per STANDARDS.md), these tests are the primary regression signal for the pipeline. Adding a new palette entry or changing the emitter's XML output starts by updating or adding a test in this directory.

## When something fails

- **`validate-tp` rejects a line** — rewrite the EN to match a canonical Tatoeba pair. Never hand-author TP.
- **`author:verify` flags drift** — `pnpm author:build <id>` regenerates the artifact from the spec. Never edit the `.tmx` directly.
- **`tsc` fails on a `@rpgjs/*` type** — check if the package ships named exports as `default` only (common beta pattern). Add a shim in `src/types/rpgjs-*.d.ts` mirroring the runtime surface.
- **Integration test hangs** — likely waiting for a map change or tick that never fires. Lower the timeout on `waitForMapChange` to get a fast error, then call `fixture.nextTick()` explicitly to advance the engine. The engine won't tick on its own in tests.
- **Integration test passes but the feature is broken in `pnpm dev`** — the test is incomplete. Integration tests don't substitute for a playtest; they just make sure the thing you already verified still works tomorrow.

## Adding tests

**Unit (pure logic):** drop `tests/build-time/<subject>.test.ts`. Import pure functions directly; no engine context. Aim for < 100 ms per file.

**Integration (real engine):** drop `tests/integration/<feature>.test.ts`. Always `afterEach(clear)`. One feature per file (singletons don't parallelize).

Add new pure-logic modules to the coverage `include` list in `vitest.config.ts` so the ratchet keeps rising.

## Docs → Tests → Code

This repo's rule: **docs describe the game, tests describe the code, code satisfies both**. If a test asserts behavior that no doc motivates, the doc is wrong and must land first. If a doc specifies behavior that no test covers, write the test before implementing. Never write code that doesn't trace back through a test to a doc.

`pnpm validate-tp` embodies this: it reads `src/content/spine/` against the corpus. If the corpus can't satisfy an EN line, the rule (per `docs/WRITING_RULES.md`) is to rewrite the EN — you're not allowed to satisfy the test by hand-crafting TP. Docs always win.
