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
    return page.locator('.rr-title-entry').nth(index);
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
    const content = page.locator('[data-testid="rr-dialog-content"]');
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

async function closeOpenDialogs(page: Page): Promise<void> {
    await page.waitForTimeout(250);
    for (let attempt = 0; attempt < 8; attempt += 1) {
        const dialog = page.locator('.rr-dialog').first();
        if (!(await dialog.isVisible().catch(() => false))) return;
        await page.evaluate(() => window.__POKI__!.testing.closeGui('rpg-dialog'));
        await page.waitForTimeout(100);
    }
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
    await advanceDialog(page, 'Rivers, today you start your own investigation.', starterTask);
    await advanceDialog(page, 'Three creatures answered the call.', starterTask);
    await advanceDialog(page, 'Choose the partner you trust at your side.', starterTask);

    await expect(dialogChoice(page, 0)).toContainText('Ashcat');
    await dialogChoice(page, 0).tap();

    const status = page.locator('[data-testid="hud-status"]');
    await expect(status).toBeVisible();
    await expect(status).toContainText('Ashcat');
    await expect(status).toContainText('L5');
    await expect(status).toContainText(/clues:\s*\d+/);
    await expect(status.locator('.rr-hud-portrait')).toHaveClass(/has-image/);
    await expect(status.locator('.rr-hud-portrait-image')).toHaveAttribute('style', /wraith\.png/);

    const revisitTask = await beginEvent(page, 'jan-sewi');
    await expect(page.locator('.rr-dialog')).toBeVisible();
    await expect(status).toBeHidden();

    await closeOpenDialogs(page);
    await expect(status).toBeVisible();

    await expect.poll(async () => {
        const task = await getTaskStatus(page, revisitTask);
        return task?.error ?? null;
    }).toBeNull();
});
