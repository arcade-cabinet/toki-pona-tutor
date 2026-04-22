import { devices, expect, test, type Page } from "@playwright/test";

test.use({
    ...devices["iPhone 13"],
});

type BrowserDebugState = {
    currentMapId: string | null;
    serverMapId: string | null;
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
    return page.locator(".rpg-ui-title-screen-menu .rpg-ui-menu-item").nth(index);
}

async function closeOpenDialogs(page: Page): Promise<void> {
    await page.waitForTimeout(250);
    for (let attempt = 0; attempt < 8; attempt += 1) {
        const dialog = page.locator(".rpg-ui-dialog").first();
        if (!(await dialog.isVisible().catch(() => false))) return;
        await page.evaluate(() => window.__POKI__!.testing.closeGui("rpg-dialog"));
        await page.waitForTimeout(100);
    }
}

test("mobile touch can open the pause overlay via the HUD toggle and return to title", async ({
    page,
}) => {
    await page.goto("/");
    await waitForReady(page);

    await page.evaluate(() => window.__POKI__!.testing.resetPersistence({ includeSaves: true }));
    await page.reload();
    await waitForReady(page);

    await expect(page.locator('[data-testid="hud-menu-toggle"]')).toBeHidden();
    await expect(page.locator(".rpg-ui-title-screen-title")).toContainText("poki soweli");

    await titleEntry(page, 0).tap();

    await expect
        .poll(async () => {
            const state = await getState(page);
            return state.saves[0]?.map ?? null;
        })
        .toBe("ma_tomo_lili");
    await page.evaluate(async () => {
        await window.__POKI__!.testing.recordMasteredWord("soweli");
        await window.__POKI__!.testing.recordMasteredWord("soweli");
        await window.__POKI__!.testing.recordMasteredWord("soweli");
        const { recordSentenceLine } = await import("./src/platform/persistence/queries.ts");
        await recordSentenceLine({
            tp: "mi moku e kili.",
            en: "I eat fruit.",
            source: "mobile-menu-e2e",
            now: "2026-04-20T00:00:00Z",
        });
    });
    await closeOpenDialogs(page);

    const hudToggle = page.locator('[data-testid="hud-menu-toggle"]');
    await expect(hudToggle).toBeVisible();

    const toggleBox = await hudToggle.boundingBox();
    expect(toggleBox).not.toBeNull();
    expect(toggleBox!.width).toBeGreaterThanOrEqual(44);
    expect(toggleBox!.height).toBeGreaterThanOrEqual(44);

    await hudToggle.tap();

    await expect(page.locator('[data-testid="pause-overlay"]')).toBeVisible();
    await closeOpenDialogs(page);
    await expect(page.locator('[data-testid="pause-overlay"]')).toBeVisible();
    await expect(hudToggle).toBeHidden();
    await expect(page.locator('[data-testid="pause-party"]')).toContainText("soweli");
    await expect(page.locator('[data-testid="pause-vocab"]')).toContainText("nasin");
    await expect(page.locator('[data-testid="pause-inventory"]')).toContainText("ijo");
    await expect(page.locator('[data-testid="pause-settings"]')).toContainText("awen");
    await expect(page.locator('[data-testid="pause-save"]')).toContainText("awen");
    await expect(page.locator('[data-testid="pause-title"]')).toContainText("pini");

    await page.locator('[data-testid="pause-vocab"]').tap();
    await expect(page.locator('[data-testid="vocab-entry-soweli"]')).toContainText("soweli");
    await expect(page.locator('[data-testid="vocab-entry-soweli"]')).toContainText("3x");
    await page.locator('[data-testid="vocab-entry-soweli"]').tap();
    await expect(page.locator(".rpg-ui-dialog-content")).toContainText("soweli");
    await expect(page.locator(".rpg-ui-dialog-content")).toContainText("lukin: 3x");
    await page.evaluate(() => window.__POKI__!.testing.closeGui("rpg-dialog"));
    await expect(page.locator('[data-testid="pause-overlay"]')).toBeVisible();
    await expect(page.locator('[data-testid="sentence-log-action"]')).toContainText("lipu nasin");
    await expect(page.locator('[data-testid="sentence-log-action"]')).toContainText("toki");
    await page.locator('[data-testid="sentence-log-action"]').tap();
    await expect(page.locator(".rpg-ui-dialog-content")).toContainText("mi moku e kili.");
    await expect(page.locator(".rpg-ui-dialog-content")).not.toContainText("I eat fruit.");
    await page.evaluate(() => window.__POKI__!.testing.closeGui("rpg-dialog"));
    await expect(page.locator('[data-testid="pause-overlay"]')).toBeVisible();
    await expect(page.locator('[data-testid="micro-game-action"]')).toContainText("wan sitelen");
    await page.locator('[data-testid="micro-game-action"]').tap();
    await expect(page.locator(".rpg-ui-dialog-choice")).toHaveCount(4);
    await expect(page.locator(".rpg-ui-dialog-choice").first()).toContainText("li");
    await page.evaluate(() => window.__POKI__!.testing.closeGui("rpg-dialog"));
    await expect(page.locator('[data-testid="pause-overlay"]')).toBeVisible();
    await expect(page.locator('[data-testid="dictionary-export-action"]')).toContainText(
        "lipu nimi",
    );
    await expect
        .poll(() => page.evaluate(() => window.__POKI_DICTIONARY_EXPORT_RUNTIME__ ?? null))
        .toMatchObject({ installed: true });
    await page.locator('[data-testid="dictionary-export-action"]').tap();
    await page.waitForFunction(
        () => window.__POKI_LAST_DICTIONARY_EXPORT__?.filename === "poki-soweli-lipu-nimi.svg",
    );
    const exportDebug = await page.evaluate(() => window.__POKI_LAST_DICTIONARY_EXPORT__!);
    expect(exportDebug.svgCard).toContain("<svg");
    expect(exportDebug.shareAttempted || exportDebug.downloadAttempted).toBe(true);
    await expect(page.locator(".rpg-ui-dialog-content")).toContainText("lipu nimi");
    await expect(page.locator(".rpg-ui-dialog-content")).toContainText("soweli");
    await page.evaluate(() => window.__POKI__!.testing.closeGui("rpg-dialog"));
    await expect(page.locator('[data-testid="pause-overlay"]')).toBeVisible();

    const pauseBox = await page.locator('[data-testid="pause-party"]').boundingBox();
    expect(pauseBox).not.toBeNull();
    expect(pauseBox!.height).toBeGreaterThanOrEqual(44);

    await page.locator('[data-testid="pause-title"]').tap();

    await expect(page.locator(".rpg-ui-title-screen-title")).toContainText("poki soweli");
    await expect(page.locator('[data-testid="hud-menu-toggle"]')).toBeHidden();
    await expect(titleEntry(page, 0)).toContainText("kama");

    await titleEntry(page, 0).tap();
    await waitForReady(page);

    await expect
        .poll(async () => {
            const state = await getState(page);
            return `${state.currentMapId}:${state.serverMapId}`;
        })
        .toBe("ma_tomo_lili:ma_tomo_lili");
});
