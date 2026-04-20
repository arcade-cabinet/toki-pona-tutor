/**
 * Dev/test-only debug surface exposed by src/standalone.ts.
 *
 * Production builds tree-shake this out (the assignment is gated on
 * `import.meta.env.DEV`). E2E tests under tests/e2e/ read the surface
 * via `page.evaluate(() => window.__POKI__.player)` etc. — no casting
 * required from within tests because this file is included in
 * tsconfig.build-time.json.
 *
 * The shape is installed immediately on module evaluation as a
 * placeholder with `ready: false`; the engine-bound accessors swap
 * in once @rpgjs/client's DI resolves (see standalone.ts retry
 * loop). That means every reader of `window.__POKI__` can assume
 * the object exists — they just need to poll `ready` until true.
 */
import type { RpgClientEngine, RpgClientPlayer } from '@rpgjs/client';

export interface PokiDebugSurface {
    /** The live RpgClientEngine once DI has resolved. Null before. */
    engine: RpgClientEngine | null;
    /** Current player (the local hero), or null pre-boot. */
    readonly player: RpgClientPlayer | null;
    /** Server-assigned player id, or null pre-boot. */
    readonly playerId: string | null;
    /** The #rpg canvas element once CanvasEngine mounts it. */
    readonly canvas: HTMLCanvasElement | null;
    /**
     * Convenience readiness signal used by Playwright:
     * true iff engine + canvas + current player are all live.
     */
    readonly ready: boolean;
}

declare global {
    interface Window {
        __POKI__?: PokiDebugSurface;
    }
}

export {};
