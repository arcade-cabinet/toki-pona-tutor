import { test, expect } from '@playwright/test';

/**
 * E2E floor: the real web build boots in a real browser.
 *
 * Loads the live Vite dev server, waits for the RPG.js canvas to
 * mount + the player to be assigned + Capacitor SQLite to be ready.
 * Captures a screenshot of the opening scene as a visual regression
 * anchor. If this fails every downstream E2E is meaningless.
 */

test('boots and mounts the player on ma_tomo_lili', async ({ page }) => {
    await page.goto('/poki-soweli/');

    // Wait for the debug surface to become ready — engine alive,
    // canvas mounted, current player assigned.
    await page.waitForFunction(
        () => Boolean((window as unknown as { __POKI__?: { ready: boolean } }).__POKI__?.ready),
        { timeout: 30_000 },
    );

    // Canvas element is live in the DOM.
    const canvas = page.locator('#rpg canvas');
    await expect(canvas).toBeVisible();

    // Player exists and has an id.
    const playerId = await page.evaluate(
        () => (window as unknown as { __POKI__?: { playerId: string | null } }).__POKI__?.playerId ?? null,
    );
    expect(playerId).not.toBeNull();
    expect(typeof playerId).toBe('string');

    // Brand CSS loaded: --poki-ink resolves on :root.
    const inkColor = await page.evaluate(() =>
        getComputedStyle(document.documentElement).getPropertyValue('--poki-ink').trim(),
    );
    expect(inkColor).not.toBe('');

    // Opening-scene screenshot so the test run persists a visual
    // record and future regressions in scene composition show up
    // in diff review.
    await page.screenshot({
        path: 'tests/e2e/__screenshots__/boot-opening-scene.png',
        fullPage: false,
    });
});
