---
title: Testing Strategy
updated: 2026-04-22
status: current
domain: quality
---

# Testing Strategy

## The rule: integration > unit

**Unit tests catch regressions in algorithms. Integration tests catch regressions in the game.** Unit tests alone don't prove anything you can't already verify by reading pure functions. Every feature that touches player-visible behavior ships with an integration test that boots the real engine first. Unit tests are reserved for what they're actually good at: pure-logic + math + formulas.

Concretely:

-   Authoring a new NPC? Integration test: create client, walk next to the NPC, call `onAction`, assert the dialog fires.
-   Authoring a new pure helper (HP threshold, move damage formula)? Unit test the math, then wire it into a component and add an integration test for the component.
-   Changing a map warp? Integration test: walk across the warp, assert `getCurrentMap()` changed.

When a bug is reported, it goes in the integration suite first and the fix has to make the new test pass. If the bug can be expressed without the engine, it also gets a unit test — but the integration test is the one that proves the user-facing behavior is fixed.

## Five layers, one rule each

| Layer                            | Lives in                                           | Gate                              | Runtime                      |
| -------------------------------- | -------------------------------------------------- | --------------------------------- | ---------------------------- |
| **1. Content pipeline**          | `scripts/validate-*.mjs`, `author:verify`          | `pnpm validate` in CI             | Node                         |
| **2. Type surface**              | `tsc --noEmit` across `src/`, `scripts/`, `tests/` | `pnpm typecheck` in CI            | Node                         |
| **3. Unit (pure logic)**         | `tests/build-time/`, vitest `unit` project         | `pnpm test:unit` + coverage in CI | Node                         |
| **4. Integration (real engine)** | `tests/integration/`, vitest `integration` project | `pnpm test:integration` in CI     | happy-dom + `@rpgjs/testing` |
| **5. E2E smoke (real browser)**  | `tests/e2e/smoke/`, Playwright                     | `pnpm test:e2e:smoke` in CI       | Chromium + xvfb + WebGL      |

## Layer 1 — Content pipeline

The cheapest catch. Runs in under a second.

-   `pnpm validate-challenges` — static challenge data against the 131-word dictionary.
-   `pnpm validate-tp` — every multi-word translatable string in `src/content/spine/**` must round-trip through the vendored Tatoeba corpus. Hand-authored TP cannot ship.
-   `pnpm author:verify` — the map-authoring contract gate. Fails when any `src/tiled/*.tmx` or `public/assets/maps/*.tmj` is orphaned, missing, or drifts from its spec.
-   `pnpm build-spine` — compiles `spine/*.json` plus emitted TMJ map objects into `generated/world.json` with Zod schema checks + green-dragon-only-in-final-beat enforcement.

Runs on every PR via `ci.yml` under the `unit` job before the vitest suite.

## Layer 2 — Type surface

`pnpm typecheck` runs two TypeScript surfaces:

-   `typecheck:src` checks `src/` and `vite.config.ts`.
-   `typecheck:build-time` checks map-authoring TypeScript, build-time unit tests, and integration tests through `tsconfig.build-time.json`.

Both commands use the same pipefail-based grep to strip one known upstream RPG.js beta bug (`@rpgjs/common/src/rooms/WorldMaps.ts`). Runs on every PR.

Catches: missing exports as `@rpgjs/*` packages churn, content-JSON shape drift, Capacitor plugin signature shifts, `event.setGraphic?.(...)` discipline.

Does **not** catch: logic errors (unit tests own this), in-engine state (integration owns this).

## Layer 3 — Unit (pure logic)

`tests/build-time/` — Vitest in Node, pure/build-time functions only. Covered by the `unit` project in `vitest.config.ts`; files are serialized because several suites exercise shared content, image, and persistence singletons.

```sh
pnpm test:unit          # run once
pnpm test:watch         # watch both projects
pnpm test:coverage      # unit + v8 coverage + ratchet check
pnpm format:src:check   # supported src/ formatting contract
```

**Coverage gate:** 95% lines / 95% functions / 90% branches / 95% statements on the scoped include list (pure-logic modules only — platform adapters and runtime wiring are integration-tested, not coverage-measured). See `vitest.config.ts` → `coverage.include`.

**Formatting gate:** `pnpm format:src:check` runs pinned Prettier over supported `src/` TypeScript, JSON, CSS, and Markdown. `.prettierignore` deliberately excludes vendored corpus JSON, generated `world.json`, generated Tiled artifacts, and CanvasEngine `.ce` files; those are validated by their own toolchains instead.

**What belongs in unit:** XP curves, catch math, wild-combat HP/damage helpers, wild-battle overlay models, combat healing item choice/use/result formatting, combat HP-bar chrome models, creature/effect/boss spritesheet derivation contracts, lead battle-avatar stat/graphic models, type matchup, trainer/final-boss battle config normalization, NG+ reset/scaling, status effects, RNG seeds, ordering/serialization helpers, color-tier thresholds, the bestiary state machine and persistence round-trip helpers, party-slot reordering, healing-item clamping, gameplay JSON config schema/reference/boundary/template checks, runtime interaction-copy formatters, species item-drop rolls/fallbacks, side-quest catalog/runtime state transitions, sentence-log querying/persistence/display formatting, `wan sitelen` round generation/scoring/RPG.js choice binding, dictionary export text/SVG/snapshot/server-emit contracts, BGM/SFX event→asset/volume maps, audio cross-fade controller behavior, client SFX volume dispatch, combat-action SFX range checks, BattleAi target/state checks, public-asset base-path mapping, workflow contract guards, roadmap inventory guards, current-state docs drift guards, and text-speed interval mapping. Anything a pure function can express.

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
import { describe, it, expect, afterEach } from "vitest";
import { testing, clear } from "@rpgjs/testing";
import server from "../../src/modules/main/server";

afterEach(async () => {
    await clear();
});

describe("<feature>", () => {
    it("<behavior>", async () => {
        const fixture = await testing([{ server }]);
        const client = await fixture.createClient();

        // Wait for onConnected → starter map.
        const player = await client.waitForMapChange("ma_tomo_lili");

        // Drive the game...
        // Assert observable state.
        expect(player.x()).toBe(128);
    });
});
```

### The fixture API

From `@rpgjs/testing` beta-1:

-   `testing(modules, clientConfig?, serverConfig?)` — boot the in-process server + client and return a fixture.
-   `fixture.createClient()` → `{ socket, client, playerId, player, waitForMapChange(mapId, timeout?) }`.
-   `fixture.nextTick(timestamp?)` — advance physics + sync by one tick.
-   `fixture.nextTickTimes(n, timestamp?)` — loop of the above.
-   `fixture.wait(ms)` / `fixture.waitUntil(promise)` — time-based waiting.
-   `fixture.clear()` — reset state (call in `afterEach`).

Prefer `waitForMapChange` over raw tick loops when the behavior is "something moved us to a new map." Prefer `nextTick` when you need to let physics/collision/encounter rolls evaluate.

### What's covered today

Two integration files currently carry the real-engine path:

-   `tests/integration/boot.test.ts` — the floor. Player connects, `onConnected` runs, lands on `ma_tomo_lili` at (128, 128).
-   `tests/integration/journey-golden-path.test.ts` — starter ceremony, first warp to `nasin_wan`, wild encounter `utala / poki / ijo / tawa` actions, bestiary seen/caught runtime writes, caught wild encounter, jan Ike rival progression, lead-avatar HP/SP/stat sync, automatic next-creature send-out when an action-battle lead faints, all four gym/badge gates, the final-boss trigger gate, `nasin_pi_telo` progression, green-dragon ending state plus `game_cleared`, paged credits on clear, respawn to the last safe village when no bench creature takes over, and manual save/load round-trip that restores external runtime state. It now also guards the catch-XP regression that previously demoted a level-5 starter after the first wild catch; the browser golden path guards the RPG.js beta learned-skill array hydration regression by requiring zero page errors through the lead-creature set-piece combat path, and `tests/e2e/full/action-battle-lead-movebar.spec.ts` proves the real movebar switch + move path against live jan Ike party order, battle sprite, HP, SP state, and attached single-target cyan reticle screenshot.

### What's coming next (priority order)

1. Add more failure-path assertions around autosave timing, resume behavior after map transitions, and additional non-happy-path combat outcomes beyond the current defeat-respawn browser slice.
2. Expand the mobile browser coverage beyond the current pause/status/hint affordances, exact tile-snapped landing, locked-warp gate handling, and rapid-reroute cancellation into deeper touch failure-path behavior.
3. Carry the browser golden-path driver onto Android/manual-device QA using the current debug APK artifact, plus iOS browser QA. Maestro flows under `.maestro/` now provide the emulator/simulator smoke scaffold for Android debug APK and iOS Safari Pages checks; signed release APK assembly is deferred until the release-keystore track is explicitly reopened.

## Layer 5 — E2E smoke (real browser)

`tests/e2e/smoke/` runs the actual browser path through Playwright and a live Vite dev server.

```sh
pnpm test:e2e:smoke
pnpm test:e2e:full
```

-   `test:e2e:smoke` is the CI browser gate: it boots the game in Chromium, verifies the starter map, web metadata/landmarks, and brand chrome load, and fails if page errors or console errors surface during boot.
-   The smoke spec also supports production preview builds via `BASE_URL=http://127.0.0.1:4173 pnpm test:e2e:smoke`; in that mode the dev-only `window.__POKI__` surface is absent, so the spec falls back to title/canvas/brand/error assertions.
-   `test:e2e:full` stays local for now; it is where slower feature-level browser coverage expands over time. The current browser paths are `tests/e2e/full/continue-save.spec.ts` (title screen, web quit-intent acknowledgement, continue restore, existing-save new-game confirm), `tests/e2e/full/pause-title.spec.ts` (Escape → pause overlay → quit-to-title → Continue), `tests/e2e/full/accessible-mode.spec.ts` (Settings route applies the accessible-mode body class, larger text token, and reduced-motion token), `tests/e2e/full/text-speed.spec.ts` (persisted text-speed setting drives the real RPG.js dialog typewriter path, including instant text at `0` cps, and proves the sitelen overlay glyph line), `tests/e2e/full/defeat-respawn.spec.ts` (player defeat opens the branded respawn fade and returns to the safe village), `tests/e2e/full/action-battle-lead-movebar.spec.ts` (iPhone viewport jan Ike set-piece combat, caught bench creature, visible target/range pill, single-target cyan reticle screenshot attachment, 44px+ switch and move tap targets, in-combat lead switch, party-order + battle-sprite update, SP spend, live BattleAi HP damage, and cooldown/ARIA DOM state), `tests/e2e/full/mobile-menu.spec.ts` (iPhone viewport, touch-only HUD menu toggle → pause overlay, Vocab glyph/word/sightings card, TP-only `lipu nasin` sentence-log dialog, `wan sitelen` micro-game choice dialog, `lipu nimi` dictionary export payload, quit-to-title → Continue), `tests/e2e/full/mobile-touch-targets.spec.ts` (iPhone viewport, 44 px touch-target audit for title entries, starter choices, HUD frame/menu, contextual hint, and pause entries), `tests/e2e/full/mobile-status.spec.ts` (iPhone viewport, HUD status strip appears after starter choice and hides during dialog), `tests/e2e/full/mobile-hint.spec.ts` (iPhone viewport, contextual hint glyph appears near `jan-sewi`, taps through to dialog, hides while dialog is open, the player sprite itself triggers the same adjacent interaction, and stray canvas taps are ignored while dialog is open), `tests/e2e/full/mobile-tap-controls.spec.ts` (iPhone viewport, real canvas tap exact-lands on the requested tile, locked warp taps walk adjacent and surface the gated east-warp dialog, rapid retaps cancel the old route in favor of the latest destination, and `jan-sewi` still auto-interacts), `tests/e2e/full/party-panel.spec.ts` (iPhone viewport, Bestiary route shows caught starter + wild catch and taps a caught row to reread its generated species description, Party route renders caught creatures, opens detail card, uses `kili` on lead and non-lead selected creatures with inventory decrement, and persists lead promotion), `tests/e2e/full/side-quest.spec.ts` (iPhone viewport, forest quest acceptance, HUD Inventory quest progress after each catch, reward collection, and completed quest row), `tests/e2e/full/visual-audit.spec.ts` (Playwright-attached PNG artifacts for title choices, starter-map canvas tile placement, mobile starter choices, mobile pause HUD, and every authored map canvas), and `tests/e2e/full/journey-golden-path.spec.ts` (starter ceremony → first warp loading overlay → fight-before-catch → capture throw/result feedback → first catch → jan Ike lead-avatar swap/restoration → battle-earned `ma` → jan Moku shop purchase of `poki_lili` + `kili` → all four badge gates → `nasin_pi_telo` → green-dragon clear → credits in a real browser).
-   The full-browser suite uses the dev-only `window.__POKI__.testing` surface to start real server-side events/shapes and then resolves them through the live browser GUI; it does not stub out encounter or save logic.
-   Playwright starts this repo's Vite server on `127.0.0.1:5173` with `--strictPort` by default so it cannot silently reuse another project's server. If another local app owns that port, run with an explicit port, for example `E2E_PORT=5174 pnpm test:e2e:full`. Set `PLAYWRIGHT_REUSE_SERVER=true` only when you have already started this repo's dev server intentionally.

The smoke suite exists because some failures only show up in a real browser: wrong base paths, missing `public/` assets, WASM load errors, and runtime rendering issues.

## Visual verification

Tests prove behavior didn't regress. They don't automatically prove the game looks right. `tests/e2e/full/visual-audit.spec.ts` captures Playwright PNG artifacts for the high-risk UI shells, starter-map canvas, and all seven authored map canvases; curated copies live under `docs/screenshots/visual-audit/`. The map-canvas audit also rejects idle screenshots that contain combat target-reticle pixels while the lead movebar is closed. Inspect those artifacts before accepting UI/tile-placement changes. Before marking any UI-touching PR ready for review:

1. Run `pnpm exec playwright test tests/e2e/full/visual-audit.spec.ts --project=full`.
2. Inspect the generated PNG artifacts under `test-results/`; if the visual output is intentionally changed, refresh the relevant curated copies under `docs/screenshots/visual-audit/`.
3. Run `pnpm dev` and click through any feature-specific path the visual audit does not cover.
4. Paste relevant screenshots in the PR description with a one-sentence description of what changed visually.

The unit tests, the integration suite, and the smoke browser gate have no opinion on whether the HP bar color gradient pleases the eye. You do.

## Mobile Emulator/Simulator QA

Maestro flows live under `.maestro/` for the device-facing release smoke layer.

```sh
pnpm maestro:check
pnpm maestro:android
pnpm maestro:ios
```

-   `maestro:check` syntax-checks every checked-in flow and does not require a device.
-   `maestro:android` runs against the installed Android debug APK package `com.pokisoweli.game`.
-   `maestro:ios` opens the deployed GitHub Pages URL in Mobile Safari until a Capacitor iOS platform exists.

See `docs/MOBILE_QA.md` for emulator setup and release-QA usage.

## Testing GitHub Actions changes

Workflow edits have a local gate:

```sh
pnpm workflow:check
```

That command runs `actionlint` over every workflow file, then `scripts/check-workflow-shell.mjs` extracts every `run:` block into temporary Bash scripts and runs `shellcheck`. The pure unit guards `tests/build-time/workflow-contract.test.ts` and `tests/build-time/release-artifacts.test.ts` separately pin the release-flow contract, full-SHA action pinning, Pages-base web bundles, deployed manifest/map presence, and tarball/APK/metadata handoff names. After producing a local Pages `dist/` with `GITHUB_PAGES=true pnpm build` and a debug APK, run `pnpm release:smoke-artifacts "$RELEASE_TAG"` to package and validate the same handoff shape before relying on a remote release run.

## Testing documentation claims

Current-state docs have explicit build-time guards:

-   `tests/build-time/docs-current-state.test.ts` blocks stale local-dev base URLs, fixed PR references, old release-smoke examples, published-release CD handoff drift, broken code-spanned docs references, stale audited content snippets, E2E full-suite inventory wording drift, UX selector drift, visual-audit screenshot inventory/dimension drift, and LORE species-inventory drift in quick-orient/current-state docs.
-   `tests/build-time/roadmap-inventory.test.ts` keeps roadmap task IDs unique, synchronizes the phase inventory table with the actual task rows, and checks that completed-row file references still exist unless the row explicitly documents a removal/rename.

These guards do not prove every prose claim. They protect the high-risk claims that have already drifted before; factual updates still require the docs audit discipline in `docs/STATE.md`.

## Testing the map-authoring toolchain

The toolchain has its own mini-harness under `tests/build-time/` — parser round-trips, emitter golden-file diffs, map metadata checks, renderer PNG pixel checks, and `map-preview-regression.test.ts` exact-pixel-diffs every committed map preview against freshly rendered TMJ output. Because maps are build artifacts, these tests are the primary regression signal for the pipeline. Adding a new palette entry, map property, or emitter XML output starts by updating or adding a test in this directory.

Verified on `2026-04-22`:

-   `pnpm author:verify` passed
-   `pnpm author:all --all` rerendered all seven maps
-   `pnpm author:all --all --dry-run` validated/emitted/rendered all seven maps without changing artifact checksums
-   after the current authored spec/artifact updates, a second full regeneration produced no additional drift across `src/tiled/*.tmx`, `public/assets/maps/*.tmj`, and `public/assets/maps/*.preview.png`
-   `pnpm exec vitest run --project=unit tests/build-time/map-preview-regression.test.ts` exact-pixel-diffed every committed preview PNG against renderer output
-   `E2E_PORT=5231 pnpm exec playwright test tests/e2e/full/visual-audit.spec.ts --project=full` attached live browser canvas PNGs for all seven authored maps and rejected idle-map combat-reticle leakage; curated copies under `docs/screenshots/visual-audit/` now match the latest artifacts

## When something fails

-   **`validate-tp` rejects a line** — rewrite the EN to match a canonical Tatoeba pair. Never hand-author TP.
-   **`author:verify` flags drift** — `pnpm author:build <id>` regenerates the artifact from the spec. Never edit `.tmx` or `.tmj` artifacts directly.
-   **`tsc` fails on a `@rpgjs/*` type** — check if the package ships named exports as `default` only (common beta pattern). Add a shim in `src/types/rpgjs-*.d.ts` mirroring the runtime surface.
-   **Integration test hangs** — likely waiting for a map change or tick that never fires. Lower the timeout on `waitForMapChange` to get a fast error, then call `fixture.nextTick()` explicitly to advance the engine. The engine won't tick on its own in tests.
-   **Integration test passes but the feature is broken in `pnpm dev`** — the test is incomplete. Integration tests don't substitute for a playtest; they just make sure the thing you already verified still works tomorrow.

## Adding tests

**Unit (pure logic):** drop `tests/build-time/<subject>.test.ts`. Import pure functions directly; no engine context. Aim for < 100 ms per file.

**Integration (real engine):** drop `tests/integration/<feature>.test.ts`. Always `afterEach(clear)`. One feature per file (singletons don't parallelize).

Add new pure-logic modules to the coverage `include` list in `vitest.config.ts` so the ratchet keeps rising.

## Docs → Tests → Code

This repo's rule: **docs describe the game, tests describe the code, code satisfies both**. If a test asserts behavior that no doc motivates, the doc is wrong and must land first. If a doc specifies behavior that no test covers, write the test before implementing. Never write code that doesn't trace back through a test to a doc.

`pnpm validate-tp` embodies this: it reads `src/content/spine/` against the corpus. If the corpus can't satisfy an EN line, the rule (per `docs/WRITING_RULES.md`) is to rewrite the EN — you're not allowed to satisfy the test by hand-crafting TP. Docs always win.
