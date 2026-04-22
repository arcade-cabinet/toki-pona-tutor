import { devices, expect, test, type Page } from '@playwright/test';

test.use({
    ...devices['iPhone 13'],
});

type BrowserDebugState = {
    currentMapId: string | null;
    serverMapId: string | null;
    starterChosen: string | null;
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

async function waitForReady(page: Page): Promise<void> {
    await page.waitForFunction(() => window.__POKI__?.ready === true, {
        timeout: 30_000,
    });
}

async function getState(page: Page): Promise<BrowserDebugState> {
    return page.evaluate(() => window.__POKI__!.testing.getState());
}

function titleEntry(page: Page, index: number) {
    return page.locator('.rpg-ui-title-screen-menu .rpg-ui-menu-item').nth(index);
}

function dialogChoice(page: Page, index: number) {
    return page.locator(`.rpg-ui-dialog-choice[data-choice-index="${index}"]`);
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

test('mobile taps can walk the player and trigger jan-sewi interaction on the real canvas', async ({ page }) => {
    await page.goto('/');
    await waitForReady(page);

    await page.evaluate(() => window.__POKI__!.testing.resetPersistence({ includeSaves: true }));
    await page.reload();
    await waitForReady(page);

    await titleEntry(page, 0).tap();

    await expect.poll(async () => {
        const state = await getState(page);
        return state.saves[0]?.map ?? null;
    }).toBe('ma_tomo_lili');

    await tapWorld(page, 160, 128);

    await expect.poll(async () => {
        const state = await getState(page);
        return `${state.position.x}:${state.position.y}`;
    }).toBe('160:128');
    await expect.poll(async () => {
        const state = await getState(page);
        return `${state.serverPosition.x}:${state.serverPosition.y}`;
    }).toBe('160:128');
    await page.waitForTimeout(400);

    const settledState = await getState(page);
    expect(`${settledState.position.x}:${settledState.position.y}`).toBe('160:128');
    expect(`${settledState.serverPosition.x}:${settledState.serverPosition.y}`).toBe('160:128');

    await tapWorld(page, 160, 96);

    await expect(page.locator('.rpg-ui-dialog-content')).toHaveText('hello');
    await expect(page.locator('[data-testid="hud-menu-toggle"]')).toBeHidden();
});

test('mobile tap on the locked east warp walks adjacent and shows the gated dialog instead of changing maps', async ({ page }) => {
    await page.goto('/');
    await waitForReady(page);

    await page.evaluate(() => window.__POKI__!.testing.resetPersistence({ includeSaves: true }));
    await page.reload();
    await waitForReady(page);

    await titleEntry(page, 0).tap();

    await expect.poll(async () => {
        const state = await getState(page);
        return state.saves[0]?.map ?? null;
    }).toBe('ma_tomo_lili');

    await tapWorld(page, 240, 80);

    await expect.poll(async () => {
        const state = await getState(page);
        return `${state.currentMapId}:${state.serverMapId}`;
    }).toBe('ma_tomo_lili:ma_tomo_lili');
    await expect.poll(async () => {
        const state = await getState(page);
        return `${state.position.x}:${state.position.y}`;
    }).toBe('192:64');
    await expect.poll(async () => {
        const state = await getState(page);
        return `${state.serverPosition.x}:${state.serverPosition.y}`;
    }).toBe('192:64');

    const state = await getState(page);
    expect(state.starterChosen).toBeNull();
    await expect(page.locator('.rpg-ui-dialog-content')).toHaveText('hello');
});

test('mobile rapid retap cancels the old route and lands on the latest destination', async ({ page }) => {
    await page.goto('/');
    await waitForReady(page);

    await page.evaluate(() => window.__POKI__!.testing.resetPersistence({ includeSaves: true }));
    await page.reload();
    await waitForReady(page);

    await titleEntry(page, 0).tap();

    await expect.poll(async () => {
        const state = await getState(page);
        return state.saves[0]?.map ?? null;
    }).toBe('ma_tomo_lili');

    await tapWorld(page, 224, 128);
    await expect.poll(async () => {
        const state = await getState(page);
        return state.position.x ?? 0;
    }).toBeGreaterThan(128);
    await page.waitForTimeout(400);
    await expect.poll(async () => {
        const state = await getState(page);
        return state.position.x ?? 0;
    }).toBeLessThan(224);
    await tapWorld(page, 160, 128);

    await expect.poll(async () => {
        const state = await getState(page);
        return `${state.position.x}:${state.position.y}`;
    }).toBe('160:128');
    await expect.poll(async () => {
        const state = await getState(page);
        return `${state.serverPosition.x}:${state.serverPosition.y}`;
    }).toBe('160:128');
});
