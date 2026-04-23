import { devices, expect, test, type Locator, type Page } from '@playwright/test';

test.use({
    ...devices['iPhone 13'],
});

const MIN_TOUCH_TARGET = 44;

type BrowserDebugState = {
    currentMapId: string | null;
    serverMapId: string | null;
    position: {
        x: number | null;
        y: number | null;
    };
    saves: Array<Record<string, unknown> | null>;
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

async function waitForMapReady(page: Page, mapId: string): Promise<void> {
    await expect.poll(async () => {
        const state = await getState(page);
        return `${state.currentMapId}:${state.serverMapId}`;
    }).toBe(`${mapId}:${mapId}`);
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

async function expectTouchTarget(locator: Locator, label: string): Promise<void> {
    await expect(locator, `${label} should be visible before auditing its hit box`).toBeVisible();

    const box = await locator.boundingBox();
    expect(box, `${label} should have a rendered hit box`).not.toBeNull();
    expect(Math.round(box!.width), `${label} touch width`).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
    expect(Math.round(box!.height), `${label} touch height`).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
}

async function expectVisibleTargets(locator: Locator, label: string): Promise<void> {
    await expect(locator.first(), `${label} should render before auditing`).toBeVisible();

    const count = await locator.count();
    expect(count, `${label} count`).toBeGreaterThan(0);

    for (let index = 0; index < count; index += 1) {
        await expectTouchTarget(locator.nth(index), `${label} ${index}`);
    }
}

async function beginEvent(page: Page, eventId: string, trigger: 'action' | 'touch' = 'action'): Promise<string> {
    return page.evaluate(({ id, mode }) => {
        return window.__POKI__!.testing.beginEvent(id, mode);
    }, { id: eventId, mode: trigger });
}

async function advanceDialog(page: Page, expectedText: string, taskId: string): Promise<void> {
    const content = page.locator('[data-testid="rr-dialog-content"]');
    await expect.poll(async () => {
        const status = await getTaskStatus(page, taskId);
        if (status?.error) {
            return `ERROR: ${status.error}`;
        }
        return (await content.textContent()) ?? '';
    }).toBe(expectedText);
    await page.evaluate(() => window.__POKI__!.testing.closeGui('rpg-dialog'));
}

async function expectTaskDone(page: Page, taskId: string): Promise<void> {
    await expect.poll(async () => {
        const status = await getTaskStatus(page, taskId);
        if (status?.error) {
            return `ERROR: ${status.error}`;
        }
        return status?.done ?? false;
    }).toBe(true);
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

test('mobile interactive chrome meets the 44 CSS-pixel touch target floor', async ({ page }) => {
    await page.goto('/');
    await waitForReady(page);

    await page.evaluate(() => window.__POKI__!.testing.resetPersistence({ includeSaves: true }));
    await page.reload();
    await waitForReady(page);

    await expectVisibleTargets(page.locator('.rr-title-entry'), 'title menu item');
    await titleEntry(page, 0).tap();

    await expect.poll(async () => {
        const state = await getState(page);
        return state.saves[0]?.map ?? state.currentMapId;
    }).toBe('riverside_home');
    await waitForMapReady(page, 'riverside_home');

    await expect(page.locator('[data-testid="hud-frame"]')).toBeVisible();
    await expectTouchTarget(page.locator('[data-testid="hud-menu-toggle"]'), 'HUD menu toggle');

    const starterTask = await beginEvent(page, 'jan-sewi');
    await advanceDialog(page, 'Rivers, today you start your own investigation.', starterTask);
    await advanceDialog(page, 'Three creatures answered the call.', starterTask);
    await advanceDialog(page, 'Choose the partner you trust at your side.', starterTask);
    await expectTouchTarget(dialogChoice(page, 0), 'starter choice 0');
    await expectTouchTarget(dialogChoice(page, 1), 'starter choice 1');
    await expectTouchTarget(dialogChoice(page, 2), 'starter choice 2');
    await dialogChoice(page, 0).tap();
    await expectTaskDone(page, starterTask);
    await expect(page.locator('.rr-dialog')).toBeHidden();

    await tapWorld(page, 160, 128);
    await expect.poll(async () => {
        const state = await getState(page);
        return `${state.position.x}:${state.position.y}`;
    }).toBe(`${160}:${128}`);

    await expectTouchTarget(page.locator('[data-testid="hint-glyph"]'), 'contextual hint glyph');

    await page.locator('[data-testid="hud-menu-toggle"]').tap();
    await expect(page.locator('[data-testid="pause-overlay"]')).toBeVisible();
    await expectVisibleTargets(page.locator('.rr-pause-route'), 'pause route tab');
    await expectVisibleTargets(page.locator('.rr-pause-footer-item'), 'pause footer item');

    await page.locator('[data-testid="pause-resume"]').tap();
    await expect(page.locator('[data-testid="pause-overlay"]')).toBeHidden();
});

test('mobile landscape title menu remains visible and tappable', async ({ page }) => {
    await page.setViewportSize({ width: 844, height: 390 });
    await page.goto('/');
    await waitForReady(page);

    await page.evaluate(() => window.__POKI__!.testing.resetPersistence({ includeSaves: true }));
    await page.reload();
    await waitForReady(page);

    const titleScreen = page.locator('[data-testid="rr-title-screen"]');
    await expect(titleScreen).toBeVisible();
    await expectVisibleTargets(page.locator('.rr-title-entry'), 'landscape title menu item');

    const titleBox = await titleScreen.boundingBox();
    const firstActionBox = await titleEntry(page, 0).boundingBox();
    expect(titleBox).not.toBeNull();
    expect(firstActionBox).not.toBeNull();
    expect(firstActionBox!.y + firstActionBox!.height).toBeLessThanOrEqual(
        titleBox!.y + titleBox!.height,
    );
});

test('mobile landscape pause footer remains visible and tappable', async ({ page }) => {
    await page.setViewportSize({ width: 844, height: 390 });
    await page.goto('/');
    await waitForReady(page);

    await page.evaluate(() => window.__POKI__!.testing.resetPersistence({ includeSaves: true }));
    await page.reload();
    await waitForReady(page);

    await titleEntry(page, 0).tap();

    await expect.poll(async () => {
        const state = await getState(page);
        return state.saves[0]?.map ?? state.currentMapId;
    }).toBe('riverside_home');
    await waitForMapReady(page, 'riverside_home');

    await page.locator('[data-testid="hud-menu-toggle"]').tap();
    await expect(page.locator('[data-testid="pause-overlay"]')).toBeVisible();
    await expectVisibleTargets(page.locator('.rr-pause-footer-item'), 'landscape pause footer item');
});
