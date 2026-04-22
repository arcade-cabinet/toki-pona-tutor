import { expect, test, type Page } from '@playwright/test';

async function waitForReady(page: Page): Promise<void> {
    await page.waitForFunction(() => window.__POKI__?.ready === true, {
        timeout: 30_000,
    });
}

function titleEntry(page: Page, index: number) {
    return page.locator('.rpg-ui-title-screen-menu .rpg-ui-menu-item').nth(index);
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
    await expect(page.locator('.rpg-ui-dialog-content')).toContainText('nasin:');
    await expect(page.locator('.rpg-ui-dialog-content')).toContainText('suli       ala');
    await page.evaluate(() => window.__POKI__!.testing.closeGui('rpg-dialog'));

    await expect(dialogChoice(page, 3)).toContainText('suli');
    await expect(dialogChoice(page, 3)).toContainText('[ala]');
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
