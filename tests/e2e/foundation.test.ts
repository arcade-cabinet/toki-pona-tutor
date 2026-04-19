import { describe, it, expect } from 'vitest';
import { startGame } from './harness/phaser-harness';

/**
 * Harness foundation test — proves the Vitest browser harness can boot
 * the real Phaser game inside a Playwright-driven chromium and read live
 * state through `window.__toki_harness__`.
 *
 * Asserts only what L2 (this layer) owns. Higher-level assertions
 * (player movement, dialog flow, screenshot diffing) depend on L1 wiring
 * the per-scene harness methods (`harnessPlayer`, `harnessMapId`,
 * `harnessDialogOpen`, plus the action methods `walkTo` / `interact` /
 * `dialogChoose`). Those are `it.todo` here with a clear pointer to L1.
 */
describe('e2e harness foundation', () => {
  it('boots the game and reports ready via window.__toki_harness__', async () => {
    const harness = await startGame({ testName: 'harness-foundation-boot' });
    try {
      expect(harness.ready).toBe(true);
      await harness.snapshot('after-boot');
    } finally {
      harness.destroy();
    }
  });

  // L1 (foundation) wires per-scene harness methods. Until that lands the
  // following assertions cannot be implemented end-to-end. Keeping them
  // as it.todo documents the intended contract for L3-L8.
  it.todo('player walks N tiles east — pending L1 (RegionScene.harnessPlayer + walkTo)');
  it.todo('screenshot captures rendered map — pending L1 (deterministic spawn + map paint)');
});
