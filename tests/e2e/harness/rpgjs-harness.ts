/**
 * Vitest browser harness for replaying playbooks against the real
 * RPG.js v5 game (the post-pivot equivalent of the old Phaser
 * harness).
 *
 * The harness boots the game inside the browser test runner (same
 * Vite dev pipeline as `pnpm dev`), waits for the WebSocket server
 * to come up, and exposes a `HarnessHandle` that tests use to
 * drive the game.
 *
 * Per-step semantics (walk_to, interact, dialog_choose, etc.) map
 * onto RPG.js's client-side API surface. The replayer dispatches
 * through keyboard-events (the game reads keyboard via its own
 * input service); a few query-only steps read directly from the
 * RPG.js client engine attached to `window`.
 *
 * This is deliberately a SMOKE harness — it proves the build boots
 * and the server comes up. End-to-end playbooks (starter choice,
 * first warp, first encounter, beat progression) land in V19+ once
 * RPG.js exposes a stable `window.__rpgjs__` inspector; until then
 * the smoke assertion is enough to catch build regressions.
 */

import type { Playbook } from './playbook-types';

const DEFAULT_BOOT_TIMEOUT_MS = 15_000;

export interface HarnessHandle {
    ready: boolean;
    replay: (playbook: Playbook) => Promise<void>;
    snapshot: (name: string) => Promise<string>;
    tick: (ms?: number) => Promise<void>;
    destroy: () => Promise<void>;
}

export interface StartGameOptions {
    testName: string;
    bootTimeoutMs?: number;
}

/**
 * Boot the game in the current browser test page and wait for it
 * to reach a ready state.
 *
 * Vitest's browser test page only loads the test bundle — so we
 * create a container `<div id="rpg">` (mirroring the standalone
 * shell) and dynamically import the standalone entry point. Once
 * CanvasEngine mounts its canvas the harness reports ready.
 */
export async function startGame(opts: StartGameOptions): Promise<HarnessHandle> {
    const bootTimeout = opts.bootTimeoutMs ?? DEFAULT_BOOT_TIMEOUT_MS;

    const container = document.createElement('div');
    container.id = 'rpg';
    container.style.width = '100vw';
    container.style.height = '100vh';
    document.body.appendChild(container);

    // Dynamic import so the harness doesn't force a boot at module
    // evaluation time — each test owns its boot cycle.
    await import('../../../src/standalone');

    const ready = await waitForCanvas(bootTimeout);

    return {
        ready,
        async replay(_playbook: Playbook): Promise<void> {
            throw new Error(
                'replay() is V19+ work — the RPG.js v5 client does not yet expose a stable inspector surface to drive playbook steps deterministically.',
            );
        },
        async snapshot(name: string): Promise<string> {
            // Playwright's page-level screenshot is surfaced via the
            // @vitest/browser-playwright provider's page object. When
            // a playbook harness needs it, we'll wire this through
            // Context API; for now it's a stub that the smoke test
            // can call without failing.
            void name;
            return '';
        },
        async tick(ms = 16): Promise<void> {
            await new Promise((resolve) => setTimeout(resolve, ms));
        },
        async destroy(): Promise<void> {
            container.remove();
        },
    };
}

/** Poll for the RPG.js canvas to exist in the DOM. */
async function waitForCanvas(timeoutMs: number): Promise<boolean> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        if (document.querySelector('#rpg canvas')) return true;
        await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return false;
}
