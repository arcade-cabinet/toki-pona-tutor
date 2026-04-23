import { expect, test, type Page } from '@playwright/test';

async function waitForReady(page: Page): Promise<void> {
    await page.waitForFunction(() => window.__POKI__?.ready === true, {
        timeout: 30_000,
    });
}

function titleEntry(page: Page, index: number) {
    return page.locator('.rr-title-entry').nth(index);
}

function dialogChoice(page: Page, index: number) {
    return page.getByTestId(`dialog-choice-${index}`);
}

test('settings accessible mode toggle applies larger-type reduced-motion body class', async ({ page }) => {
    await page.goto('/');
    await waitForReady(page);

    await page.evaluate(() => window.__POKI__!.testing.resetPersistence({ includeSaves: true }));
    await page.reload();
    await waitForReady(page);

    await titleEntry(page, 1).click();
    await expect(page.locator('[data-testid="rr-dialog-content"]')).toContainText('Settings:');
    await expect(page.locator('[data-testid="rr-dialog-content"]')).toContainText('access       off');
    await page.evaluate(() => window.__POKI__!.testing.closeGui('rpg-dialog'));

    await expect(dialogChoice(page, 3)).toContainText('accessible mode');
    await expect(dialogChoice(page, 3)).toContainText('[off]');
    await dialogChoice(page, 3).click();

    await expect(page.locator('body')).toHaveClass(/poki-accessible-mode/);
    await expect.poll(async () => page.evaluate(() =>
        getComputedStyle(document.body).getPropertyValue('--duration-menu').trim(),
    )).toBe('0ms');
    await expect.poll(async () => page.evaluate(() =>
        getComputedStyle(document.body).getPropertyValue('--text-body-mobile').trim(),
    )).toBe('18px');

    await page.evaluate(async () => {
        const { setAccessibleMode } = await import('./src/platform/persistence/settings.ts');
        await setAccessibleMode(false);
    });
    await expect(page.locator('body')).not.toHaveClass(/poki-accessible-mode/);
});
