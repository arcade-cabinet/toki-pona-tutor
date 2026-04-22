import { expect, test, type Page } from '@playwright/test';

type BrowserDebugState = {
    currentMapId: string | null;
    serverMapId: string | null;
};

type BrowserTaskStatus = {
    done: boolean;
    error: string | null;
};

async function waitForReady(page: Page): Promise<void> {
    await page.waitForFunction(() => window.__POKI__?.ready === true, {
        timeout: 30_000,
    });
}

async function getState(page: Page): Promise<BrowserDebugState> {
    return page.evaluate(() => window.__POKI__!.testing.getState());
}

async function getTaskStatus(page: Page, taskId: string): Promise<BrowserTaskStatus | null> {
    return page.evaluate((id) => window.__POKI__!.testing.getTaskStatus(id), taskId);
}

function titleEntry(page: Page, index: number) {
    return page.locator('.rpg-ui-title-screen-menu .rpg-ui-menu-item').nth(index);
}

function dialogChoice(page: Page, index: number) {
    return page.locator(`.rpg-ui-dialog-choice[data-choice-index="${index}"]`);
}

async function beginEvent(page: Page, eventId: string): Promise<string> {
    return page.evaluate((id) => window.__POKI__!.testing.beginEvent(id), eventId);
}

async function beginPlayerDefeat(page: Page): Promise<string> {
    return page.evaluate(() => window.__POKI__!.testing.beginPlayerDefeat());
}

async function getPartyCount(page: Page): Promise<number> {
    return page.evaluate(async () => {
        return (await window.__POKI__!.testing.getParty()).length;
    });
}

async function advanceDialog(page: Page, expectedText: string, taskId?: string): Promise<void> {
    const content = page.locator('.rpg-ui-dialog-content');
    if (taskId) {
        await expect.poll(async () => {
            const status = await getTaskStatus(page, taskId);
            if (status?.error) {
                return `ERROR: ${status.error}`;
            }
            return (await content.textContent()) ?? '';
        }).toBe(expectedText);
    } else {
        await expect(content).toHaveText(expectedText);
    }
    await page.evaluate(() => window.__POKI__!.testing.closeGui('rpg-dialog'));
}

test('player defeat shows a respawn fade before returning to the safe village', async ({ page }) => {
    await page.goto('/');
    await waitForReady(page);

    await page.evaluate(() => window.__POKI__!.testing.resetPersistence({ includeSaves: true }));
    await page.reload();
    await waitForReady(page);

    await titleEntry(page, 0).click();

    const starterTask = await beginEvent(page, 'jan-sewi');
    await advanceDialog(page, 'hello', starterTask);
    await advanceDialog(page, 'kili sin li pona tawa sijelo.', starterTask);
    await advanceDialog(page, 'kule seme li pona tawa sina?', starterTask);
    await dialogChoice(page, 0).click();
    await expect.poll(async () => {
        const status = await getTaskStatus(page, starterTask);
        return `${status?.done ?? false}:${status?.error ?? ''}`;
    }).toBe('true:');
    await expect.poll(async () => getPartyCount(page)).toBe(1);

    await expect.poll(async () => {
        const state = await getState(page);
        return `${state.currentMapId}:${state.serverMapId}`;
    }).toBe('ma_tomo_lili:ma_tomo_lili');

    const defeatTask = await beginPlayerDefeat(page);
    const defeatScreen = page.getByTestId('defeat-screen');
    await expect(defeatScreen).toContainText('pakala!');
    await expect(defeatScreen).toContainText('sina tawa ma tomo.');
    await expect(defeatScreen).toHaveAttribute('data-phase', /fallen|returning/);
    await expect(defeatScreen).toBeHidden({ timeout: 5_000 });

    await advanceDialog(page, 'lukin la sina pilin pona...', defeatTask);
    await expect.poll(async () => {
        const state = await getState(page);
        return `${state.currentMapId}:${state.serverMapId}`;
    }).toBe('ma_tomo_lili:ma_tomo_lili');
    await expect.poll(async () => {
        const status = await getTaskStatus(page, defeatTask);
        return status?.done && !status.error;
    }).toBe(true);
});
