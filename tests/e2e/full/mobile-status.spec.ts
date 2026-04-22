import { devices, expect, test, type Page } from '@playwright/test';

test.use({
    ...devices['iPhone 13'],
});

type BrowserTaskStatus = {
    done: boolean;
    error: string | null;
};

async function waitForReady(page: Page): Promise<void> {
    await page.waitForFunction(() => window.__POKI__?.ready === true, {
        timeout: 30_000,
    });
}

async function getTaskStatus(page: Page, taskId: string): Promise<BrowserTaskStatus | null> {
    return page.evaluate((id) => window.__POKI__!.testing.getTaskStatus(id), taskId);
}

function titleEntry(page: Page, index: number) {
    return page.locator('.rpg-ui-title-screen-menu .rpg-ui-menu-item').nth(index);
}

function dialogChoice(page: Page, index: number) {
    return page.getByTestId(`dialog-choice-${index}`);
}

async function beginEvent(page: Page, eventId: string, trigger: 'action' | 'touch' = 'action'): Promise<string> {
    return page.evaluate(({ id, mode }) => {
        return window.__POKI__!.testing.beginEvent(id, mode);
    }, { id: eventId, mode: trigger });
}

async function advanceDialog(page: Page, expectedText: string | RegExp, taskId?: string): Promise<void> {
    const content = page.locator('.rpg-ui-dialog-content');
    if (typeof expectedText === 'string' && taskId) {
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

test('mobile HUD status strip appears after starter choice and hides during dialog', async ({ page }) => {
    await page.goto('/');
    await waitForReady(page);

    await page.evaluate(() => window.__POKI__!.testing.resetPersistence({ includeSaves: true }));
    await page.reload();
    await waitForReady(page);

    await expect(page.locator('[data-testid="hud-status"]')).toBeHidden();
    await titleEntry(page, 0).tap();

    const starterTask = await beginEvent(page, 'jan-sewi');
    await advanceDialog(page, 'hello', starterTask);
    await advanceDialog(page, 'kili sin li pona tawa sijelo.', starterTask);
    await advanceDialog(page, 'kule seme li pona tawa sina?', starterTask);

    await expect(dialogChoice(page, 0)).toContainText('kon moli');
    await dialogChoice(page, 0).tap();

    const status = page.locator('[data-testid="hud-status"]');
    await expect(status).toBeVisible();
    await expect(status).toContainText('kon moli');
    await expect(status).toContainText('L5');
    await expect(status).toContainText(/toki:\s*\d+/);
    await expect(status.locator('.poki-hud-status-portrait')).toHaveClass(/has-image/);
    await expect(status.locator('.poki-hud-status-portrait-image')).toHaveAttribute('style', /wraith\.png/);

    const revisitTask = await beginEvent(page, 'jan-sewi');
    await expect(page.locator('.rpg-ui-dialog')).toBeVisible();
    await expect(status).toBeHidden();

    await page.evaluate(() => window.__POKI__!.testing.closeGui('rpg-dialog'));
    await expect(status).toBeVisible();

    await expect.poll(async () => {
        const task = await getTaskStatus(page, revisitTask);
        return task?.error ?? null;
    }).toBeNull();
});
