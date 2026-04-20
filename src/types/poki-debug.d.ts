/**
 * Dev/test-only debug surface exposed by src/standalone.ts.
 *
 * Production builds tree-shake this out (the assignment is gated on
 * import.meta.env.DEV). E2E tests under tests/e2e/ read this via
 * `page.evaluate(() => window.__POKI__.player.x)` etc.
 */
declare global {
    interface Window {
        __POKI__?: {
            engine: unknown;
            readonly player: unknown | null;
            readonly playerId: string | null;
            readonly canvas: HTMLCanvasElement | null;
            readonly ready: boolean;
        };
    }
}

export {};
