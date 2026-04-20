import { test, expect } from '@playwright/test';

/**
 * Smoke: the real web build boots in a real browser on the starter map.
 *
 * Loads the live Vite dev server, waits for the RPG.js engine + canvas
 * + current player to all be live (the `__POKI__.ready` sentinel),
 * then asserts the player actually landed on the starter map — the
 * one non-negotiable invariant of boot.
 *
 * Also checks the brand token resolves (`--poki-ink`), which proves
 * the self-hosted font + palette CSS made it through vite's rewrite
 * pipeline with the correct base path. If the CI build used the wrong
 * base, the font + token would 404 and this assertion would fail.
 *
 * `toHaveScreenshot` captures a visual-regression anchor of the
 * opening scene — committed under
 * `tests/e2e/smoke/boot.spec.ts-snapshots/` on first run, compared on
 * every subsequent run. Small pixel deltas are tolerated via the
 * project-level `maxDiffPixels` config in playwright.config.ts.
 */

test('boots on the starter map with brand chrome applied', async ({ page }) => {
    await page.goto('/poki-soweli/');

    // Wait for engine + canvas + current player to all resolve.
    await page.waitForFunction(() => window.__POKI__?.ready === true, {
        timeout: 30_000,
    });

    // Player was actually assigned an id.
    const playerId = await page.evaluate(() => window.__POKI__?.playerId ?? null);
    expect(playerId).toMatch(/^[a-z0-9_-]+$/i);

    // Canvas element is visible in the DOM.
    await expect(page.locator('#rpg canvas')).toBeVisible();

    // Brand CSS resolved — --poki-ink is the token every panel derives
    // its text color from. If fonts.css / brand.css didn't load at the
    // right base path, this token would be empty.
    const inkColor = await page.evaluate(() =>
        getComputedStyle(document.documentElement).getPropertyValue('--poki-ink').trim(),
    );
    expect(inkColor).not.toBe('');

    // Visual-regression anchor (committed under *-snapshots/ by Playwright
    // on first run; compared thereafter).
    await expect(page).toHaveScreenshot('boot-opening-scene.png', {
        fullPage: false,
    });
});
