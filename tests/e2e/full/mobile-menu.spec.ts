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
    return page.locator(".rr-title-entry").nth(index);
}

async function closeOpenDialogs(page: Page): Promise<void> {
    await page.waitForTimeout(250);
    for (let attempt = 0; attempt < 8; attempt += 1) {
        const dialog = page.locator(".rr-dialog").first();
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
    await expect(page.locator('[data-testid="rr-title-title"]')).toContainText("Rivers Reckoning");

    await titleEntry(page, 0).tap();

    await expect
        .poll(async () => {
            const state = await getState(page);
            return state.saves[0]?.map ?? null;
        })
        .toBe("riverside_home");
    await page.evaluate(async () => {
        await window.__POKI__!.testing.recordClue("torch-path");
        await window.__POKI__!.testing.recordClue("torch-path");
        await window.__POKI__!.testing.recordClue("torch-path");
        const { recordSentenceLine } = await import("./src/platform/persistence/queries.ts");
        await recordSentenceLine({
            text: "The orchard path is safe.",
            en: "The orchard path is safe.",
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
    await expect(page.locator('[data-testid="pause-party"]')).toContainText("Party");
    await expect(page.locator('[data-testid="pause-vocab"]')).toContainText("Clues");
    await expect(page.locator('[data-testid="pause-inventory"]')).toContainText("Gear");
    await expect(page.locator('[data-testid="pause-settings"]')).toContainText("Settings");
    await expect(page.locator('[data-testid="pause-save"]')).toContainText("Save");
    await expect(page.locator('[data-testid="pause-title"]')).toContainText("Title");

    await page.locator('[data-testid="pause-vocab"]').tap();
    await expect(page.locator('[data-testid="vocab-entry-torch-path"]')).toContainText(
        "Torch path",
    );
    await expect(page.locator('[data-testid="vocab-entry-torch-path"]')).toContainText("3x");
    await page.locator('[data-testid="vocab-entry-torch-path"]').tap();
    await expect(page.locator('[data-testid="rr-dialog-content"]')).toContainText("Torch path");
    await expect(page.locator('[data-testid="rr-dialog-content"]')).toContainText("seen: 3x");
    await page.evaluate(() => window.__POKI__!.testing.closeGui("rpg-dialog"));
    await expect(page.locator('[data-testid="pause-overlay"]')).toBeVisible();
    await expect(page.locator('[data-testid="sentence-log-action"]')).toContainText("Field Log");
    await expect(page.locator('[data-testid="sentence-log-action"]')).toContainText("entries");
    await page.locator('[data-testid="sentence-log-action"]').tap();
    await expect(page.locator('[data-testid="rr-dialog-content"]')).toContainText(
        "The orchard path is safe.",
    );
    await page.evaluate(() => window.__POKI__!.testing.closeGui("rpg-dialog"));
    await expect(page.locator('[data-testid="pause-overlay"]')).toBeVisible();
    await expect(page.locator('[data-testid="micro-game-action"]')).toContainText("Field Notes");
    await page.locator('[data-testid="micro-game-action"]').tap();
    await expect(page.locator(".rr-dialog-choice")).toHaveCount(4);
    await expect(page.getByTestId("dialog-choice-0")).toBeVisible();
    await page.evaluate(() => window.__POKI__!.testing.closeGui("rpg-dialog"));
    await expect(page.locator('[data-testid="pause-overlay"]')).toBeVisible();
    await expect(page.locator('[data-testid="dictionary-export-action"]')).toContainText(
        "Export Clues",
    );
    await expect
        .poll(() => page.evaluate(() => window.__POKI_DICTIONARY_EXPORT_RUNTIME__ ?? null))
        .toMatchObject({ installed: true });
    await page.locator('[data-testid="dictionary-export-action"]').tap();
    await expect(page.locator('[data-testid="rr-dialog-content"]')).toContainText("Clue Journal");
    await expect(page.locator('[data-testid="rr-dialog-content"]')).toContainText("Torch path");
    const exportDebug = await page.evaluate(() => window.__POKI_LAST_DICTIONARY_EXPORT__ ?? null);
    if (exportDebug) {
        expect(exportDebug.filename).toBe("rivers-reckoning-clues.svg");
        expect(exportDebug.svgCard).toContain("<svg");
        expect(exportDebug.shareAttempted || exportDebug.downloadAttempted).toBe(true);
    }
    await page.evaluate(() => window.__POKI__!.testing.closeGui("rpg-dialog"));
    await expect(page.locator('[data-testid="pause-overlay"]')).toBeVisible();

    const pauseBox = await page.locator('[data-testid="pause-party"]').boundingBox();
    expect(pauseBox).not.toBeNull();
    expect(pauseBox!.height).toBeGreaterThanOrEqual(44);

    await page.locator('[data-testid="pause-title"]').tap();

    await expect(page.locator('[data-testid="rr-title-title"]')).toContainText("Rivers Reckoning");
    await expect(page.locator('[data-testid="hud-menu-toggle"]')).toBeHidden();
    await expect(titleEntry(page, 0)).toContainText("Continue");

    await titleEntry(page, 0).tap();
    await waitForReady(page);

    await expect
        .poll(async () => {
            const state = await getState(page);
            return `${state.currentMapId}:${state.serverMapId}`;
        })
        .toBe("riverside_home:riverside_home");
});
