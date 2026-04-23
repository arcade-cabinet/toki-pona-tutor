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
    return page.locator('.rr-title-entry').nth(index);
}

test('escape opens the pause menu and quit-to-title returns to the title shell', async ({ page }) => {
    await page.goto('/');
    await waitForReady(page);

    await page.evaluate(() => window.__POKI__!.testing.resetPersistence({ includeSaves: true }));
    await page.reload();
    await waitForReady(page);

    await expect(page.locator('[data-testid="rr-title-title"]')).toContainText('Rivers Reckoning');
    await expect(titleEntry(page, 0)).toContainText('New Game');
    await titleEntry(page, 0).click();

    await expect.poll(async () => {
        const state = await getState(page);
        return state.saves[0]?.map ?? null;
    }).toBe('riverside_home');

    await page.keyboard.press('Escape');
    await expect(page.locator('[data-testid="pause-overlay"] [data-testid="rr-pause-title"]')).toContainText('Menu');
    await expect(page.getByTestId('pause-party')).toContainText('Party');
    await expect(page.getByTestId('pause-vocab')).toContainText('Clues');
    await expect(page.getByTestId('pause-inventory')).toContainText('Gear');
    await expect(page.getByTestId('pause-bestiary')).toContainText('Bestiary');
    await expect(page.getByTestId('pause-settings')).toContainText('Settings');
    await expect(page.getByTestId('pause-resume')).toContainText('Resume');
    await expect(page.getByTestId('pause-save')).toContainText('Save');
    await expect(page.getByTestId('pause-title')).toContainText('Title');

    await page.getByTestId('pause-title').click();

    await expect(page.locator('[data-testid="rr-title-title"]')).toContainText('Rivers Reckoning');
    await expect(titleEntry(page, 0)).toContainText('Continue');
    await expect(titleEntry(page, 0)).toContainText('0');
    await expect(titleEntry(page, 1)).toContainText('New Game');
    await expect(titleEntry(page, 2)).toContainText('Settings');
    await expect(titleEntry(page, 3)).toContainText('Quit');

    await titleEntry(page, 0).click();
    await waitForReady(page);

    await expect.poll(async () => {
        const state = await getState(page);
        return state.currentMapId;
    }).toBe('riverside_home');
    await expect.poll(async () => {
        const state = await getState(page);
        return state.serverMapId;
    }).toBe('riverside_home');
    await expect.poll(async () => {
        const state = await getState(page);
        return `${state.position.x},${state.position.y}`;
    }).toBe('128,128');
    await expect.poll(async () => {
        const state = await getState(page);
        return `${state.serverPosition.x},${state.serverPosition.y}`;
    }).toBe('128,128');
});
