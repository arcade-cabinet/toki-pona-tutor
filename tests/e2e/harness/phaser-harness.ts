import { createGame } from '../../../src/game/config';
import { installHarness, setHarnessReady, uninstallHarness } from '../../../src/game/harness';
import type { TokiHarness } from '../../../src/game/harness';
import type { Playbook, PlaybookStep } from './playbook-types';
import { captureScreenshot } from './screenshot';

/**
 * Vitest browser harness for replaying playbooks against the real Phaser
 * game.
 *
 * The harness boots the game inside the browser test runner, polls
 * `window.__toki_harness__.ready` until the active scene is up, then
 * exposes a `HarnessHandle` that tests use to drive the game step by step.
 *
 * Per-step semantics live in `replay()`'s switch — it dispatches each
 * playbook step through either the inspector window object (for queries
 * + non-input actions) or DOM events (for keyboard / pointer input). L1
 * is responsible for adding the per-scene action methods (`walkTo`,
 * `interact`, `dialogChoose`); until then those steps throw a clear
 * "pending L1" error and tests using them must be `it.todo`.
 */

const DEFAULT_BOOT_TIMEOUT_MS = 10_000;
const DEFAULT_DIALOG_TIMEOUT_MS = 2_000;

declare global {
  interface Window {
    __toki_harness__?: TokiHarness;
  }
}

export interface HarnessHandle {
  /** True if the game booted and the harness reports ready. */
  ready: boolean;
  /** Replay every step in the playbook in order. Throws on failure. */
  replay: (playbook: Playbook) => Promise<void>;
  /** Capture a named screenshot under tests/e2e/__screenshots__/. */
  snapshot: (name: string) => Promise<string>;
  /** Wait `ms` real time, yielding to Phaser's RAF loop in between. */
  tick: (ms?: number) => Promise<void>;
  /** Read the live harness inspector. Throws if not installed. */
  inspector: () => TokiHarness;
  /** Tear down the Phaser instance + harness. Idempotent. */
  destroy: () => void;
}

/**
 * Boot the game in the current browser test page and wait for the
 * harness to mark itself ready.
 *
 * Vitest's browser test page only loads the test bundle — it does not
 * mount the React app. So the harness creates a fresh container div,
 * boots Phaser via the same `createGame()` factory the production app
 * uses, installs the inspector, and waits for it to report ready.
 *
 * Each call returns an isolated `HarnessHandle` that owns its game
 * instance; call `destroy()` (or rely on the per-test cleanup) to tear
 * it down.
 */
export async function startGame(opts: { testName?: string; bootTimeoutMs?: number } = {}): Promise<HarnessHandle> {
  const testName = opts.testName ?? 'unnamed-test';
  const bootTimeout = opts.bootTimeoutMs ?? DEFAULT_BOOT_TIMEOUT_MS;

  // Mount a fresh container — Vitest gives us a clean DOM per test file.
  const container = document.createElement('div');
  container.id = `toki-harness-${Date.now()}`;
  container.style.width = '480px';
  container.style.height = '320px';
  document.body.appendChild(container);

  const game = createGame(container);
  installHarness(() => {
    const scenes = game.scene.getScenes(true);
    return scenes && scenes.length > 0 ? scenes[0] : null;
  });
  setHarnessReady(true);

  await waitFor(() => Boolean(window.__toki_harness__), bootTimeout, 'harness object never appeared on window');
  await waitFor(() => window.__toki_harness__?.ready === true, bootTimeout, 'harness never reported ready');

  const inspector = (): TokiHarness => {
    const h = window.__toki_harness__;
    if (!h) throw new Error('window.__toki_harness__ missing — was DEV mode disabled?');
    return h;
  };

  const tick = async (ms = 16): Promise<void> => {
    const start = performance.now();
    while (performance.now() - start < ms) {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    }
  };

  const snapshot = (name: string): Promise<string> => captureScreenshot(testName, name);

  const replay = async (playbook: Playbook): Promise<void> => {
    for (const [i, step] of playbook.steps.entries()) {
      try {
        await dispatchStep(step, { testName: playbook.name, tick, snapshot });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        throw new Error(`[playbook "${playbook.name}" step ${i} kind="${step.kind}"] ${msg}`);
      }
    }
  };

  let destroyed = false;
  const destroy = (): void => {
    if (destroyed) return;
    destroyed = true;
    uninstallHarness();
    game.destroy(true);
    container.remove();
  };

  return {
    get ready() {
      return inspector().ready;
    },
    replay,
    snapshot,
    tick,
    inspector,
    destroy,
  };
}

interface DispatchContext {
  testName: string;
  tick: (ms?: number) => Promise<void>;
  snapshot: (name: string) => Promise<string>;
}

/**
 * Dispatch a single playbook step. Steps that need per-scene actions
 * (walk_to, interact, dialog_choose) defer to harness methods that L1
 * will add — they currently throw `pending L1` errors so callers know
 * to gate their tests with `it.todo` until the foundation lands.
 */
async function dispatchStep(step: PlaybookStep, ctx: DispatchContext): Promise<void> {
  switch (step.kind) {
    case 'screenshot':
      await ctx.snapshot(step.name);
      return;

    case 'wait_for_dialog': {
      const timeout = step.timeoutMs ?? DEFAULT_DIALOG_TIMEOUT_MS;
      await waitFor(
        () => window.__toki_harness__?.dialogOpen() === true,
        timeout,
        'dialog did not open within timeout',
      );
      return;
    }

    case 'walk_to':
    case 'interact':
    case 'dialog_choose':
      throw new Error(
        `step "${step.kind}" requires L1 foundation harness methods (walkTo / interact / dialogChoose) — pending L1 landing`,
      );

    default: {
      // Exhaustiveness check: if a new step kind is added to the union
      // without a case here, TS will flag this assignment.
      const _exhaustive: never = step;
      throw new Error(`unknown playbook step: ${JSON.stringify(_exhaustive)}`);
    }
  }
}

/**
 * Poll `predicate` every animation frame until it returns truthy or
 * `timeoutMs` elapses. Throws `Error(failureMessage)` on timeout.
 */
async function waitFor(
  predicate: () => boolean,
  timeoutMs: number,
  failureMessage: string,
): Promise<void> {
  const start = performance.now();
  while (performance.now() - start < timeoutMs) {
    if (predicate()) return;
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  }
  throw new Error(`${failureMessage} (waited ${timeoutMs}ms)`);
}
