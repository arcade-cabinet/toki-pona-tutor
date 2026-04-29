import { expect, test, type Page } from '@playwright/test';

/**
 * E2E: procedural chunk navigation.
 *
 * Verifies that the chunk-map-provider module produces a navigable world:
 * - chunk_0_0 loads and the server-side player lands there
 * - Consecutive chunk transitions (0,0) → (1,0) → (0,1) all resolve
 * - Negative-coord chunks load without page errors
 */

async function waitForReady(page: Page): Promise<void> {
    await page.waitForFunction(() => window.__POKI__?.ready === true, {
        timeout: 30_000,
    });
}

// Center of a 32×24 outdoor chunk — guaranteed walkable (no collision at origin center).
const CHUNK_CENTER = { x: 16, y: 12 };

async function moveToChunk(page: Page, mapId: string, pos = CHUNK_CENTER): Promise<void> {
    await page.evaluate(
        ({ id, position }) => window.__POKI__!.testing.moveServerPlayer(position, id),
        { id: mapId, position: pos },
    );
}

async function pollServerMapId(page: Page): Promise<string | null> {
    return page.evaluate(() => {
        if (!window.__POKI__?.ready) return null;
        return window.__POKI__.testing.getState().then((s) => s.serverMapId ?? null);
    });
}

test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForReady(page);
    await page.evaluate(() => window.__POKI__!.testing.resetPersistence({ includeSaves: true }));
    await page.reload();
    await waitForReady(page);
});

test('chunk_0_0 loads when player is moved there', async ({ page }) => {
    await moveToChunk(page, 'chunk_0_0');
    await expect.poll(() => pollServerMapId(page), { timeout: 10_000 }).toBe('chunk_0_0');
});

test('consecutive chunk transitions resolve correctly', async ({ page }) => {
    await moveToChunk(page, 'chunk_0_0');
    await expect.poll(() => pollServerMapId(page), { timeout: 10_000 }).toBe('chunk_0_0');

    await moveToChunk(page, 'chunk_1_0');
    await expect.poll(() => pollServerMapId(page), { timeout: 10_000 }).toBe('chunk_1_0');

    await moveToChunk(page, 'chunk_0_1');
    await expect.poll(() => pollServerMapId(page), { timeout: 10_000 }).toBe('chunk_0_1');
});

test('negative-coord chunk loads without page error', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(e.message));

    await moveToChunk(page, 'chunk_-1_-1');
    await expect.poll(() => pollServerMapId(page), { timeout: 10_000 }).toBe('chunk_-1_-1');

    expect(pageErrors).toHaveLength(0);
});
