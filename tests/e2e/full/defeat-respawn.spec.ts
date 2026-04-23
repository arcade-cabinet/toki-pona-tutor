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
    return page.locator('.rr-title-entry').nth(index);
}

function dialogChoice(page: Page, index: number) {
    return page.getByTestId(`dialog-choice-${index}`);
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
    const content = page.locator('[data-testid="rr-dialog-content"]');
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
    await advanceDialog(page, 'Rivers, today you start your own investigation.', starterTask);
    await advanceDialog(page, 'Three creatures answered the call.', starterTask);
    await advanceDialog(page, 'Choose the partner you trust at your side.', starterTask);
    await dialogChoice(page, 0).click();
    await expect.poll(async () => {
        const status = await getTaskStatus(page, starterTask);
        return `${status?.done ?? false}:${status?.error ?? ''}`;
    }).toBe('true:');
    await expect.poll(async () => getPartyCount(page)).toBe(1);

    await expect.poll(async () => {
        const state = await getState(page);
        return `${state.currentMapId}:${state.serverMapId}`;
    }).toBe('riverside_home:riverside_home');

    const defeatTask = await beginPlayerDefeat(page);
    const defeatScreen = page.getByTestId('defeat-screen');
    await expect(defeatScreen).toContainText('Knocked down!');
    await expect(defeatScreen).toContainText('Returning to the last safe place.');
    await expect(defeatScreen).toHaveAttribute('data-phase', /fallen|returning/);
    await expect(defeatScreen).toBeHidden({ timeout: 5_000 });

    await advanceDialog(page, 'You are safe. Rest here, then try again.', defeatTask);
    await expect.poll(async () => {
        const state = await getState(page);
        return `${state.currentMapId}:${state.serverMapId}`;
    }).toBe('riverside_home:riverside_home');
    await expect.poll(async () => {
        const status = await getTaskStatus(page, defeatTask);
        return status?.done && !status.error;
    }).toBe(true);
});
