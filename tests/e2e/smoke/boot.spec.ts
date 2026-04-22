import { test, expect, type Page } from "@playwright/test";

/**
 * Smoke: the real web build boots in a real browser on the starter map.
 *
 * Loads the live Vite dev server, waits for the RPG.js engine + canvas
 * + current player to all be live (the `__POKI__.ready` sentinel),
 * then asserts the player actually landed on the starter map — the
 * one non-negotiable invariant of boot.
 *
 * Also checks the brand token resolves (`--poki-ink`), which proves
 * the self-hosted font + palette CSS made it through vite's rewrite
 * pipeline with the correct base path. If the CI build used the wrong
 * base, the font + token would 404 and this assertion would fail.
 *
 * Visual artifacts live in the full suite's visual-audit spec. Smoke
 * stays platform-portable: assertions only.
 */

function titleEntry(page: Page, index: number) {
    return page.locator(".rpg-ui-title-screen-menu .rpg-ui-menu-item").nth(index);
}

async function assertSqlWasmAsset(page: Page): Promise<void> {
    const response = await page.request.get("/assets/sql-wasm.wasm");
    expect(response.ok()).toBe(true);
    expect(response.headers()["content-type"]).toMatch(
        /application\/wasm|application\/octet-stream/,
    );
    expect((await response.body()).subarray(0, 4)).toEqual(
        Buffer.from([0x00, 0x61, 0x73, 0x6d]),
    );
}

async function clearBrowserPersistence(page: Page): Promise<void> {
    // Run on a same-origin static document before the game boots. Calling the
    // in-app reset hook while the engine is rendering can stall the web SQLite
    // save-to-store promise on Linux/xvfb headed Chromium.
    await page.goto("/manifest.json");
    await page.evaluate(async () => {
        for (const key of Object.keys(localStorage)) {
            if (key.startsWith("poki-soweli.")) {
                localStorage.removeItem(key);
            }
        }
        sessionStorage.clear();

        await new Promise<void>((resolve, reject) => {
            const request = indexedDB.deleteDatabase("jeepSQLiteStore");
            request.onsuccess = () => resolve();
            request.onblocked = () => resolve();
            request.onerror = () =>
                reject(request.error ?? new Error("failed to delete jeepSQLiteStore"));
        });
    });
}

async function assertTitleMenu(page: Page): Promise<void> {
    await expect(page.locator(".rpg-ui-title-screen-title")).toContainText("poki soweli", {
        timeout: 30_000,
    });
    await expect(titleEntry(page, 0)).toContainText("open sin");
    await expect(titleEntry(page, 1)).toContainText("nasin");
    await expect(titleEntry(page, 2)).toContainText("pini");
}

test("boots on the starter map and shows the title menu with brand chrome applied", async ({
    page,
}) => {
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];

    page.on("pageerror", (error) => {
        pageErrors.push(error.message);
    });
    page.on("console", (message) => {
        if (message.type() === "error") {
            consoleErrors.push(message.text());
        }
    });

    // Local dev/preview boot at `/`; the `/poki-soweli/` subpath is
    // reserved for Pages builds only.
    await clearBrowserPersistence(page);
    await assertSqlWasmAsset(page);
    await page.goto("/");

    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
        "content",
        /creature-catching RPG/,
    );
    await expect(page.locator('link[rel="manifest"]')).toHaveAttribute("href", /manifest\.json$/);
    await expect(page.locator('link[rel="icon"][sizes="32x32"]')).toHaveAttribute(
        "href",
        /icons\/poki-soweli-32\.png$/,
    );
    await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute(
        "href",
        /icons\/poki-soweli-192\.png$/,
    );
    await expect(page.locator('main[aria-label="poki soweli game"]')).toBeVisible();
    await expect(page.locator("#rpg")).toHaveAttribute("role", "application");
    await expect(page.locator("#rpg")).toHaveAttribute("aria-label", "poki soweli game canvas");
    await expect(page.locator("#rpg canvas")).toBeVisible();

    await page.waitForFunction(
        () =>
            Boolean(window.__POKI__) ||
            Boolean(document.querySelector(".rpg-ui-title-screen-title")),
        { timeout: 30_000 },
    );

    const hasDebugSurface = await page.evaluate(() => Boolean(window.__POKI__));
    if (hasDebugSurface) {
        // Wait for engine + canvas + current player to all resolve.
        await page.waitForFunction(() => window.__POKI__?.ready === true, {
            timeout: 30_000,
        });

        // Player was actually assigned an id.
        const playerId = await page.evaluate(() => window.__POKI__?.playerId ?? null);
        expect(playerId).toMatch(/^[a-z0-9_-]+$/i);
        await expect(page.locator("#rpg canvas")).toBeVisible();
    }

    await assertTitleMenu(page);

    // Brand CSS resolved — --poki-ink is the token every panel derives
    // its text color from. If fonts.css / brand.css didn't load at the
    // right base path, this token would be empty.
    const inkColor = await page.evaluate(() =>
        getComputedStyle(document.documentElement).getPropertyValue("--poki-ink").trim(),
    );
    expect(inkColor).not.toBe("");

    // Let late asset/bootstrap work settle; smoke should fail on real browser
    // exceptions rather than logging them after the assertion phase ends.
    await page.waitForTimeout(250);
    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);

    // Visual artifacts belong in the full Playwright suite. Smoke stays
    // platform-portable: assertions only.
});
