import { expect, test, type Page } from '@playwright/test';

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

test('escape opens the pause menu and quit-to-title returns to the title shell', async ({ page }) => {
    await page.goto('/');
    await waitForReady(page);

    await page.evaluate(() => window.__POKI__!.testing.resetPersistence({ includeSaves: true }));
    await page.reload();
    await waitForReady(page);

    await expect(page.locator('.rpg-ui-title-screen-title')).toContainText('poki soweli');
    await expect(titleEntry(page, 0)).toContainText('open sin');
    await titleEntry(page, 0).click();

    await expect.poll(async () => {
        const state = await getState(page);
        return state.saves[0]?.map ?? null;
    }).toBe('ma_tomo_lili');

    await page.keyboard.press('Escape');
    await expect(page.locator('[data-testid="pause-overlay"] .rpg-ui-title-screen-title')).toContainText('nasin');
    await expect(page.getByTestId('pause-party')).toContainText('soweli');
    await expect(page.getByTestId('pause-vocab')).toContainText('nasin');
    await expect(page.getByTestId('pause-inventory')).toContainText('ijo');
    await expect(page.getByTestId('pause-bestiary')).toContainText('lipu');
    await expect(page.getByTestId('pause-settings')).toContainText('awen');
    await expect(page.getByTestId('pause-resume')).toContainText('kama');
    await expect(page.getByTestId('pause-save')).toContainText('awen');
    await expect(page.getByTestId('pause-title')).toContainText('pini');

    await page.getByTestId('pause-title').click();

    await expect(page.locator('.rpg-ui-title-screen-title')).toContainText('poki soweli');
    await expect(titleEntry(page, 0)).toContainText('kama');
    await expect(titleEntry(page, 0)).toContainText('0');
    await expect(titleEntry(page, 1)).toContainText('open sin');
    await expect(titleEntry(page, 2)).toContainText('nasin');
    await expect(titleEntry(page, 3)).toContainText('pini');

    await titleEntry(page, 0).click();
    await waitForReady(page);

    await expect.poll(async () => {
        const state = await getState(page);
        return state.currentMapId;
    }).toBe('ma_tomo_lili');
    await expect.poll(async () => {
        const state = await getState(page);
        return state.serverMapId;
    }).toBe('ma_tomo_lili');
    await expect.poll(async () => {
        const state = await getState(page);
        return `${state.position.x},${state.position.y}`;
    }).toBe('128,128');
    await expect.poll(async () => {
        const state = await getState(page);
        return `${state.serverPosition.x},${state.serverPosition.y}`;
    }).toBe('128,128');
});
