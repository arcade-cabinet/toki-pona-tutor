import { devices, expect, test, type Page } from '@playwright/test';

test.use({
    ...devices['iPhone 13'],
});

type BrowserDebugState = {
    currentMapId: string | null;
    serverMapId: string | null;
    position: {
        x: number | null;
        y: number | null;
    };
    serverPosition: {
        x: number | null;
        y: number | null;
    };
    saves: Array<Record<string, unknown> | null>;
};

const TILE_SIZE = 16;

async function waitForReady(page: Page): Promise<void> {
    await page.waitForFunction(() => window.__POKI__?.ready === true, {
        timeout: 30_000,
    });
}

async function getState(page: Page): Promise<BrowserDebugState> {
    return page.evaluate(() => window.__POKI__!.testing.getState());
}

async function waitForMapReady(page: Page, mapId: string): Promise<void> {
    await expect.poll(async () => {
        const state = await getState(page);
        return `${state.currentMapId}:${state.serverMapId}`;
    }).toBe(`${mapId}:${mapId}`);
}

function titleEntry(page: Page, index: number) {
    return page.locator('.rr-title-entry').nth(index);
}

async function tapWorld(page: Page, x: number, y: number): Promise<void> {
    const position = await page.evaluate(({ worldX, worldY }) => {
        return window.__POKI__!.testing.worldToCanvas(worldX, worldY);
    }, { worldX: x, worldY: y });

    const canvasBox = await page.locator('#rpg canvas').boundingBox();
    expect(canvasBox).not.toBeNull();

    await page.touchscreen.tap(
        canvasBox!.x + position.x,
        canvasBox!.y + position.y,
    );
}

test('mobile contextual hint appears near jan-sewi and can trigger dialog', async ({ page }) => {
    await page.goto('/');
    await waitForReady(page);

    await page.evaluate(() => window.__POKI__!.testing.resetPersistence({ includeSaves: true }));
    await page.reload();
    await waitForReady(page);

    await titleEntry(page, 0).tap();
    await waitForReady(page);
    await expect.poll(async () => {
        const state = await getState(page);
        return state.saves[0]?.map ?? null;
    }).toBe('riverside_home');
    await waitForMapReady(page, 'riverside_home');

    await tapWorld(page, 160, 128);
    await expect.poll(async () => {
        const state = await getState(page);
        return `${state.position.x}:${state.position.y}`;
    }).toBe('160:128');

    const hint = page.locator('[data-testid="hint-glyph"]');
    await expect(hint).toBeVisible();
    await expect(hint).toContainText('talk');
    await expect(hint).toHaveAttribute('aria-label', /Interact hint talk/);

    const hintBox = await hint.boundingBox();
    expect(hintBox).not.toBeNull();
    expect(hintBox!.width).toBeGreaterThanOrEqual(44);
    expect(hintBox!.height).toBeGreaterThanOrEqual(44);

    await hint.tap();

    await expect(page.locator('.rr-dialog')).toBeVisible();
    await expect(page.locator('[data-testid="rr-dialog-content"]')).toHaveText('Rivers, today you start your own investigation.');
    await page.locator('[data-testid="rr-dialog"]').tap();
    await expect(page.locator('[data-testid="rr-dialog-content"]')).toHaveText('Three creatures answered the call.');
    await expect(hint).toBeHidden();
    await expect(page.locator('[data-testid="hud-menu-toggle"]')).toBeHidden();
});

test('mobile tap on the player sprite triggers the current adjacent interaction', async ({ page }) => {
    await page.goto('/');
    await waitForReady(page);

    await page.evaluate(() => window.__POKI__!.testing.resetPersistence({ includeSaves: true }));
    await page.reload();
    await waitForReady(page);

    await titleEntry(page, 0).tap();
    await waitForReady(page);
    await expect.poll(async () => {
        const state = await getState(page);
        return state.saves[0]?.map ?? null;
    }).toBe('riverside_home');
    await waitForMapReady(page, 'riverside_home');

    await tapWorld(page, 160, 128);
    await expect.poll(async () => {
        const state = await getState(page);
        return `${state.position.x}:${state.position.y}`;
    }).toBe('160:128');

    await expect(page.locator('[data-testid="hint-glyph"]')).toBeVisible();

    const state = await getState(page);
    expect(state.position.x).not.toBeNull();
    expect(state.position.y).not.toBeNull();

    await tapWorld(
        page,
        (state.position.x ?? 0) + TILE_SIZE / 2,
        (state.position.y ?? 0) + TILE_SIZE,
    );

    await expect(page.locator('.rr-dialog')).toBeVisible();
    await expect(page.locator('[data-testid="rr-dialog-content"]')).toHaveText('Rivers, today you start your own investigation.');
});

test('mobile canvas taps are ignored while dialog is open', async ({ page }) => {
    await page.goto('/');
    await waitForReady(page);

    await page.evaluate(() => window.__POKI__!.testing.resetPersistence({ includeSaves: true }));
    await page.reload();
    await waitForReady(page);

    await titleEntry(page, 0).tap();
    await waitForReady(page);
    await expect.poll(async () => {
        const state = await getState(page);
        return state.saves[0]?.map ?? null;
    }).toBe('riverside_home');
    await waitForMapReady(page, 'riverside_home');

    await tapWorld(page, 160, 128);
    await expect.poll(async () => {
        const state = await getState(page);
        return `${state.position.x}:${state.position.y}`;
    }).toBe('160:128');

    await page.locator('[data-testid="hint-glyph"]').tap();
    await expect(page.locator('[data-testid="rr-dialog-content"]')).toHaveText('Rivers, today you start your own investigation.');

    const before = await getState(page);
    await tapWorld(page, 224, 128);
    await page.waitForTimeout(750);

    const after = await getState(page);
    await expect(page.locator('[data-testid="rr-dialog-content"]')).toHaveText('Rivers, today you start your own investigation.');
    expect(after.position).toEqual(before.position);
    expect(after.serverPosition).toEqual(before.serverPosition);
});
