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

async function moveToChunk(page: Page, mapId: string, x = 16, y = 12): Promise<void> {
    await page.evaluate(
        ({ id, pos }) => window.__POKI__!.testing.moveServerPlayer(pos, id),
        { id: mapId, pos: { x, y } },
    );
}

async function pollServerMapId(page: Page): Promise<string | null> {
    const state = await page.evaluate(() => window.__POKI__!.testing.getState());
    return state.serverMapId ?? null;
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
