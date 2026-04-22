import { expect, test, type Page } from '@playwright/test';

async function waitForReady(page: Page): Promise<void> {
    await page.waitForFunction(() => window.__POKI__?.ready === true, {
        timeout: 30_000,
    });
}

function titleEntry(page: Page, index: number) {
    return page.locator('.rpg-ui-title-screen-menu .rpg-ui-menu-item').nth(index);
}

async function setTextSpeed(page: Page, cps: number): Promise<void> {
    await page.evaluate(async (next) => {
        const { setTextSpeed } = await import('./src/platform/persistence/settings.ts');
        await setTextSpeed(next);
    }, cps);
}

async function setSitelenOverlay(page: Page, enabled: boolean): Promise<void> {
    await page.evaluate(async (next) => {
        const { setSitelenOverlay } = await import('./src/platform/persistence/settings.ts');
        await setSitelenOverlay(next);
    }, enabled);
}

async function prepareFreshTitle(page: Page, textSpeed: number): Promise<void> {
    await page.goto('/');
    await waitForReady(page);
    await page.evaluate(() => window.__POKI__!.testing.resetPersistence({ includeSaves: true }));
    await page.reload();
    await waitForReady(page);
    await setTextSpeed(page, textSpeed);
}

test('text-speed 0 renders RPG.js dialog text instantly', async ({ page }) => {
    await prepareFreshTitle(page, 0);

    await titleEntry(page, 1).click();
    const dialog = page.locator('.rpg-ui-dialog-content');
    await expect(dialog).toBeVisible();
    await page.waitForTimeout(80);

    await expect(dialog).toContainText('kalama');
});

test('nonzero text speed keeps RPG.js dialog text on the typewriter path', async ({ page }) => {
    await prepareFreshTitle(page, 24);

    await titleEntry(page, 1).click();
    const dialog = page.locator('.rpg-ui-dialog-content');
    await expect(dialog).toBeVisible();
    await page.waitForTimeout(80);

    expect(await dialog.textContent()).not.toContain('kalama');
});

test('sitelen overlay setting renders a glyph line during RPG.js dialog', async ({ page }) => {
    await prepareFreshTitle(page, 0);
    await setSitelenOverlay(page, true);
    const kalamaGlyph = await page.evaluate(async () => {
        const { glyphForDisplay } = await import('./src/styles/sitelen-glyph.ts');
        return glyphForDisplay('kalama');
    });

    await titleEntry(page, 1).click();
    const overlay = page.locator('[data-testid="dialog-sitelen-overlay"]');
    await expect(overlay).toBeVisible();
    await expect(overlay).toContainText(kalamaGlyph);
    await expect(overlay).not.toContainText('kalama');
});
