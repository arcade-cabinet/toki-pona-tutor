import { describe, it, expect } from 'vitest';
import { startGame } from './harness/rpgjs-harness';

/**
 * Smoke harness for the RPG.js v5 game. The assertion target is
 * intentionally narrow: the build boots + the CanvasEngine canvas
 * mounts inside the Vitest browser page. This catches regressions
 * like broken Vite config, missing deps, or runtime errors during
 * module init without depending on gameplay state.
 *
 * Playbook-driven end-to-end (walk, interact, dialog flow, screenshot
 * diffing) is V19+ work — it needs a stable `window.__rpgjs__`
 * inspector surface that RPG.js v5 beta doesn't expose yet. Each
 * gameplay assertion below is `it.todo` with a pointer to what
 * would unblock it.
 */
describe('e2e harness foundation (RPG.js v5)', () => {
    it('boots the game and mounts the canvas', async () => {
        const harness = await startGame({ testName: 'harness-foundation-boot' });
        try {
            expect(harness.ready).toBe(true);
        } finally {
            await harness.destroy();
        }
    });

    // Requires RPG.js v5 to expose a stable inspector surface
    // (window.__rpgjs__ or similar) so the harness can read player
    // position, active map id, dialog state, etc. deterministically.
    it.todo('player can walk one tile east');
    it.todo('interacting with jan Sewi opens the starter-ceremony dialog');
    it.todo('selecting a starter sets the starter_chosen flag + opens warp_east');
    it.todo('capture success writes to party_roster');
    it.todo('defeat at HP 0 respawns the player at the last village');
});
