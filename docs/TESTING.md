---
title: Testing Strategy
updated: 2026-04-22
status: current
domain: quality
---

# Testing Strategy

Unit tests guard pure contracts. Integration and headed browser tests prove the game.

## Gate Matrix

| Layer | Command | Purpose |
| --- | --- | --- |
| Content/map validation | `pnpm validate` | challenge clue references and generated map artifact drift |
| Spine build | `pnpm build-spine` | Zod validation and generated world output |
| Type surface | `pnpm typecheck` | source, build tooling, and tests |
| Unit | `pnpm test:unit` | pure logic, generated contracts, docs/workflow guards |
| Integration | `pnpm test:integration` | real RPG.js engine in Node/happy-dom |
| Browser smoke | `pnpm test:e2e:smoke` | headed Chromium boot path under xvfb in CI |
| Full browser | `pnpm test:e2e:full` | local progression, mobile, visual, and golden-path coverage |
| Pages build | `GITHUB_PAGES=true pnpm build` | deployable web bundle with `/poki-soweli/` base |
| Android debug | `pnpm android:build-debug` | Capacitor bundle, sync, and debug APK |

## Content And Map Validation

`pnpm validate` runs:

- `pnpm validate-challenges` against `src/content/challenges.json` and `src/content/clues.json`.
- `pnpm author:verify` against emitted `.tmx`, `.tmj`, and preview artifacts.

`pnpm build-spine` compiles authored spine JSON and generated map-object data into `src/content/generated/world.json`.

## Unit Tests

Unit tests live under `tests/build-time/`. They cover pure game logic, config schemas, UI copy formatting, workflow contracts, release artifact packaging, map emitters/renderers, docs drift guards, and other contracts that do not need the engine.

Coverage is intentionally scoped to pure/build-time modules. Runtime adapters and RPG.js behavior belong in integration or E2E.

## Integration Tests

Integration tests live under `tests/integration/` and boot the real RPG.js graph through `@rpgjs/testing`.

They cover:

- boot and initial map placement
- starter ceremony
- wild encounter actions
- capture/bestiary writes
- rival and region-master progression
- badge gates
- final route and green-dragon state
- respawn
- save/load round trip

Use integration first for player-visible server/runtime behavior.

## Browser E2E

Playwright runs headed. In CI it runs under `xvfb-run`; do not convert these suites to headless.

`pnpm test:e2e:smoke` is the PR browser gate. It verifies the game boots in real Chromium without page/console errors and with the expected shell/canvas.

`pnpm test:e2e:full` is local. The full suite currently has 27 full browser tests across 15 files and covers title/save flows, settings, text speed, clue overlay, mobile HUD/menu/status/hint/tap controls, party/bestiary, side quests, wild battle, action-battle movebar, visual audit, and the golden path to credits.

## Visual Verification

`tests/e2e/full/visual-audit.spec.ts` emits screenshots for high-risk UI shells and every authored map. Curated copies live under `docs/screenshots/visual-audit/`.

`tests/e2e/full/journey-golden-path.spec.ts` emits periodic PNG, JSON, and Markdown diagnostic triplets. Diagnostics include current/server map ID, player position, collision context, 3x3 tile context, tileset families, HUD/dialog state, camera scale, visible UI, and checklist findings.

Before accepting UI, map, tile, or art changes:

1. Run the relevant visual audit/golden path.
2. Inspect the generated artifacts under `test-results/`.
3. Refresh curated screenshots only when the visual change is intentional.
4. Call out remaining visual risks in the PR.

## Mobile QA

Maestro flows live under `.maestro/`.

```sh
pnpm maestro:check
pnpm maestro:android
pnpm maestro:ios
```

- `maestro:check` syntax-checks flows without a device.
- `maestro:android` targets the installed debug APK package `com.riversreckoning.game`.
- `maestro:ios` opens deployed GitHub Pages in Mobile Safari until a native iOS target exists.

Maestro is scaffolded, not device-proven yet. Closing release QA still requires actual Android emulator execution, iOS simulator Pages execution, and at least one physical-device debug APK smoke.

## Workflow And Release Tests

Use:

```sh
pnpm workflow:check
pnpm release:smoke-artifacts "$RELEASE_TAG"
```

`workflow:check` runs actionlint and shellcheck against workflow `run:` blocks.

`release:smoke-artifacts` packages the current Pages `dist/` plus the debug APK into the same artifact shape that `release.yml` hands to `cd.yml`. The release/deploy contract is `release.yml` artifact creation followed by `cd.yml` `workflow_run` consumption, not a published-release race.

## Failure Guidance

- If map verification fails, edit the spec and regenerate. Do not patch emitted maps.
- If config validation fails, fix the authored JSON or schema deliberately.
- If integration hangs, lower the wait timeout and advance the fixture with explicit ticks.
- If browser smoke fails, inspect page errors and asset/base-path requests before changing tests.
- If visual diagnostics warn, decide whether the warning is acceptable product debt or a required map/art fix.
