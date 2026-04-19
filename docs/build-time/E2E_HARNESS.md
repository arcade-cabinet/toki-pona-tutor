---
title: E2E Harness
updated: 2026-04-19
status: current
domain: quality
---

# Vitest browser harness for end-to-end game tests

The E2E harness is the path tests use to drive the real Phaser game inside
a Playwright-controlled Chromium and assert against live scene state. It
is the contract every higher-level test layer (L3-L8) extends.

## What this layer (L2) wires

- `vitest.config.e2e.ts` — second Vitest config, browser mode, Playwright
  provider, chromium instance, scoped to `tests/e2e/**/*.test.ts`. Merged
  with `vite.config.ts` so React + Solid plugins, `BASE_URL`, and
  `import.meta.env.DEV` all behave exactly like `pnpm dev`.
- `vitest.config.build-time.ts` — the prior Node-mode config, renamed
  for clarity. Build-time tests under `tests/build-time/` run there.
- `tsconfig.e2e.json` — strict TS config that includes the harness +
  e2e tests + `@vitest/browser/providers/playwright` types.
- `src/game/harness.ts` — defines `window.__toki_harness__`, gated by
  `import.meta.env.DEV` so production bundles never include it.
- `src/game/PhaserGame.tsx` — installs the inspector after game create,
  flips `ready` true on boot, uninstalls on unmount.
- `tests/e2e/harness/playbook-types.ts` — discriminated union of
  playbook step kinds (`walk_to`, `interact`, `wait_for_dialog`,
  `dialog_choose`, `screenshot`).
- `tests/e2e/harness/phaser-harness.ts` — `startGame()` boots + waits
  for `ready`; `HarnessHandle` exposes `replay`, `snapshot`, `tick`,
  `inspector`.
- `tests/e2e/harness/screenshot.ts` — capture via Vitest browser API,
  filename convention `{test}__{step}__{timestamp}.png` under
  `tests/e2e/__screenshots__/` (gitignored by default).
- `tests/e2e/foundation.test.ts` — proves the loop works end-to-end.

## What's still placeholder (waiting on L1)

The `window.__toki_harness__` getters call optional per-scene methods
(`harnessPlayer`, `harnessMapId`, `harnessDialogOpen`) that the L1
foundation layer is responsible for adding to `RegionScene` (and the
dialog overlay). Until L1 lands:

- `harness.player()` returns `null`.
- `harness.mapId()` returns `null`.
- `harness.dialogOpen()` returns `false`.
- Playbook steps `walk_to`, `interact`, `dialog_choose` throw a clear
  `pending L1` error from the replayer — tests using them must be
  `it.todo` for now.

`harness.ready` is set to `true` once `Phaser.Game` boots. L1 will move
this signal to per-scene `create()` once the foundation lands, which is
a strictly stronger ready signal but requires the scene-level wiring.

## How to run

```sh
pnpm test:e2e            # one-shot
pnpm test:e2e:watch      # watch mode
HEADED=1 pnpm test:e2e   # show the chromium window for debugging
```

`pnpm test:build-time` continues to run the Node-mode toolchain tests at
the same speed it always did. The two configs are independent.

## How the inspector works

`window.__toki_harness__` is the entire surface tests can read. It is
populated only when `import.meta.env.DEV` is true — production builds
have no `__toki_harness__` global at all, so there is zero exposure.

```ts
interface TokiHarness {
  ready: boolean;
  scene: () => Phaser.Scene | null;
  player: () => { tile: { x; y }; px: { x; y } } | null;
  mapId: () => string | null;
  dialogOpen: () => boolean;
}
```

The contract for L1: each Phaser scene that wants to be queryable
attaches optional methods to itself with the prefix `harness*`
(`harnessPlayer`, `harnessMapId`, `harnessDialogOpen`). The inspector
delegates to those methods whenever the corresponding getter is called
— so as L1+ scenes add real values they flow through without further
inspector changes.

Per-scene action methods (`walkTo(tile)`, `interact()`,
`dialogChoose(option)`) will be added later via the same convention.
The replayer's `dispatchStep` switch grows a case per kind that calls
the matching scene method.

## Screenshot convention

`tests/e2e/__screenshots__/{test-name}__{step-name}__{ISO-timestamp}.png`

`__screenshots__/` is gitignored. To commit a screenshot as a
regression baseline use `git add -f`. The orchestrator agent decides
when to bring an image into the tree.

## Adding a new playbook step

1. Add the step variant to the `PlaybookStep` union in
   `playbook-types.ts` with JSDoc semantics.
2. Add a `case` to `dispatchStep` in `phaser-harness.ts`. The TypeScript
   exhaustiveness check (`const _exhaustive: never = step`) at the
   bottom of the switch will fail if you forget.
3. If the step needs new scene-level state, extend the `TokiHarness`
   interface in `src/game/harness.ts` and the inspector populate hook.

## What this is NOT

- Not a unit-test runner. Pure-logic tests live in `tests/build-time/`.
- Not a visual-diff baseline runner. Screenshots are captured for
  inspection; image diffing is a separate concern that can layer on top.
- Not a replacement for `pnpm dev`. The harness boots the same Vite
  config as dev — but manual exploration still happens at the dev
  server, not under Vitest.
