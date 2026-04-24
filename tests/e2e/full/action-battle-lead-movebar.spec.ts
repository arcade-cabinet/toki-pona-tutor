import { devices, expect, test, type Locator, type Page, type TestInfo } from "@playwright/test";
import { readFileSync, writeFileSync } from "node:fs";
import { PNG } from "pngjs";

const MIN_TOUCH_TARGET = 44;
const visualsConfig = JSON.parse(
    readFileSync(new URL("../../../src/content/gameplay/visuals.json", import.meta.url), "utf-8"),
) as { combat_target_reticle: { primary_color: string } };
const reticlePrimary = Number.parseInt(
    visualsConfig.combat_target_reticle.primary_color.slice(1),
    16,
);
const RETICLE_PRIMARY_RGB = {
    r: (reticlePrimary >> 16) & 0xff,
    g: (reticlePrimary >> 8) & 0xff,
    b: reticlePrimary & 0xff,
};
const RETICLE_TOLERANCE = 16;
const ACTIVE_RETICLE_MIN_PIXELS = 48;
const ACTIVE_RETICLE_CAPTURE_ATTEMPTS = 16;
const ACTIVE_RETICLE_CAPTURE_INTERVAL_MS = 200;

type BrowserDebugState = {
    currentMapId: string | null;
    starterChosen: string | null;
    serverMapId: string | null;
    serverGraphic: string | null;
    saves: Array<Record<string, unknown> | null>;
};

type BrowserTaskStatus = {
    done: boolean;
    error: string | null;
};

type BrowserPartyMember = {
    slot: number;
    speciesId: string;
    level: number;
    xp: number;
};

type BrowserCombatState = {
    eventHp: number | null;
    eventPosition: {
        x: number | null;
        y: number | null;
    };
    playerHp: number | null;
    playerSp: number | null;
    playerPosition: {
        x: number | null;
        y: number | null;
    };
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

async function getCombatState(page: Page, eventId: string): Promise<BrowserCombatState> {
    return page.evaluate((id) => window.__POKI__!.testing.getCombatState(id), eventId);
}

async function getParty(page: Page): Promise<BrowserPartyMember[]> {
    return page.evaluate(() => window.__POKI__!.testing.getParty());
}

async function setLeadHp(page: Page, hp: number): Promise<void> {
    await page.evaluate((value) => window.__POKI__!.testing.setLeadHp(value), hp);
}

async function setEventHp(page: Page, eventId: string, hp: number): Promise<void> {
    await page.evaluate(({ id, value }) => window.__POKI__!.testing.setEventHp(id, value), {
        id: eventId,
        value: hp,
    });
}

function titleEntry(page: Page, index: number) {
    return page.locator(".rr-title-entry").nth(index);
}

function dialogChoice(page: Page, index: number) {
    return page.getByTestId(`dialog-choice-${index}`);
}

async function expectTouchTarget(locator: Locator, label: string): Promise<void> {
    await expect(locator, `${label} should be visible before touch audit`).toBeVisible();
    const box = await locator.boundingBox();
    expect(box, `${label} should have a rendered hit box`).not.toBeNull();
    expect(Math.round(box!.width), `${label} touch width`).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
    expect(Math.round(box!.height), `${label} touch height`).toBeGreaterThanOrEqual(
        MIN_TOUCH_TARGET,
    );
}

async function captureCanvas(page: Page, testInfo: TestInfo, name: string): Promise<string> {
    const path = testInfo.outputPath(`${name}.png`);
    const dataUrl = await page.locator("#rpg canvas").evaluate(async (element) => {
        if (!(element instanceof HTMLCanvasElement)) {
            throw new Error("captureCanvas: #rpg canvas is not a canvas element");
        }
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        const width = Math.max(1, element.width);
        const height = Math.max(1, element.height);
        const copy = document.createElement("canvas");
        copy.width = width;
        copy.height = height;
        const context = copy.getContext("2d");
        if (!context) {
            throw new Error("captureCanvas: copy canvas context unavailable");
        }
        context.drawImage(element, 0, 0, width, height);
        return copy.toDataURL("image/png");
    });
    const [, base64] = dataUrl.split(",");
    if (!base64) {
        throw new Error("captureCanvas: failed to read canvas pixels");
    }
    writeFileSync(path, Buffer.from(base64, "base64"));

    await testInfo.attach(name, {
        path,
        contentType: "image/png",
    });
    return path;
}

async function captureCanvasWithActiveReticle(
    page: Page,
    testInfo: TestInfo,
    name: string,
): Promise<string> {
    let latestPath = "";
    for (let attempt = 0; attempt < ACTIVE_RETICLE_CAPTURE_ATTEMPTS; attempt += 1) {
        if (attempt > 0) {
            await page.waitForTimeout(ACTIVE_RETICLE_CAPTURE_INTERVAL_MS);
        }
        latestPath = await captureCanvas(
            page,
            testInfo,
            attempt === 0 ? name : `${name}-retry-${attempt}`,
        );
        if (countReticlePrimaryPixels(latestPath) >= ACTIVE_RETICLE_MIN_PIXELS) {
            return latestPath;
        }
    }
    return latestPath;
}

function countReticlePrimaryPixels(path: string): number {
    const png = PNG.sync.read(readFileSync(path));
    let count = 0;
    for (let index = 0; index < png.data.length; index += 4) {
        const r = png.data[index];
        const g = png.data[index + 1];
        const b = png.data[index + 2];
        const a = png.data[index + 3];
        if (a <= 0) continue;
        const exactColor =
            Math.abs(r - RETICLE_PRIMARY_RGB.r) <= RETICLE_TOLERANCE &&
            Math.abs(g - RETICLE_PRIMARY_RGB.g) <= RETICLE_TOLERANCE &&
            Math.abs(b - RETICLE_PRIMARY_RGB.b) <= RETICLE_TOLERANCE;
        const blendedCyan = b >= 175 && g >= 155 && b - r >= 50 && g - r >= 35;
        if (exactColor || blendedCyan) {
            count += 1;
        }
    }
    return count;
}

function expectActiveCombatReticle(path: string): void {
    expect(
        countReticlePrimaryPixels(path),
        "active action-battle screenshot should include sprite-local combat target reticle pixels",
    ).toBeGreaterThanOrEqual(ACTIVE_RETICLE_MIN_PIXELS);
}

async function beginEvent(
    page: Page,
    eventId: string,
    trigger: "action" | "touch" = "action",
): Promise<string> {
    return page.evaluate(
        ({ id, mode }) => {
            return window.__POKI__!.testing.beginEvent(id, mode);
        },
        { id: eventId, mode: trigger },
    );
}

async function beginForestEncounter(page: Page, speciesId: string): Promise<string> {
    return page.evaluate((id) => {
        return window.__POKI__!.testing.beginShape(
            {
                name: `movebar_${id}`,
                properties: {
                    type: "Encounter",
                    species: JSON.stringify({ [id]: 100 }),
                    level_min: 3,
                    level_max: 3,
                },
            },
            { randomValues: Array.from({ length: 16 }, () => 0) },
        );
    }, speciesId);
}

async function advanceDialog(
    page: Page,
    expectedText: string | RegExp,
    taskId: string,
): Promise<void> {
    const content = page.locator('[data-testid="rr-dialog-content"]');
    await expect
        .poll(async () => {
            const status = await getTaskStatus(page, taskId);
            if (status?.error) {
                return `ERROR: ${status.error}`;
            }
            return (await content.textContent()) ?? "";
        })
        .toMatch(expectedText);
    await page.evaluate(() => window.__POKI__!.testing.closeGui("rpg-dialog"));
}

test("mobile action-battle lead movebar taps spend SP and damage the live rival", async ({
    browser,
    baseURL,
}, testInfo) => {
    const context = await browser.newContext({
        ...devices["iPhone 13"],
    });
    const page = await context.newPage();
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];

    try {
        if (!baseURL) {
            throw new Error("Playwright baseURL is required for the mobile movebar context");
        }
        page.on("pageerror", (error) => {
            pageErrors.push(error.message);
        });
        page.on("console", (message) => {
            if (message.type() === "error") {
                consoleErrors.push(message.text());
            }
        });

        await page.goto(new URL("/", baseURL).toString());
        await waitForReady(page);

        await page.evaluate(() =>
            window.__POKI__!.testing.resetPersistence({ includeSaves: true }),
        );
        await page.reload();
        await waitForReady(page);

        await expect(titleEntry(page, 0)).toContainText("New Game");
        await titleEntry(page, 0).tap();
        await expect
            .poll(async () => {
                const state = await getState(page);
                return state.saves[0]?.map ?? null;
            })
            .toBe("riverside_home");

        const starterTask = await beginEvent(page, "jan-sewi");
        await advanceDialog(page, "Rivers, today you start your own investigation.", starterTask);
        await advanceDialog(page, "Three creatures answered the call.", starterTask);
        await advanceDialog(page, "Choose the partner you trust at your side.", starterTask);
        await expect(dialogChoice(page, 0)).toContainText("Ashcat");
        await dialogChoice(page, 0).tap();
        await expect
            .poll(async () => {
                const status = await getTaskStatus(page, starterTask);
                return `${status?.done ?? false}:${status?.error ?? ""}`;
            })
            .toBe("true:");
        await expect
            .poll(async () => {
                const state = await getState(page);
                return state.starterChosen;
            })
            .toBe("ashcat");

        const warpTask = await beginEvent(page, "warp_east", "touch");
        await expect
            .poll(async () => {
                const status = await getTaskStatus(page, warpTask);
                return `${status?.done ?? false}:${status?.error ?? ""}`;
            })
            .toBe("true:");
        await expect
            .poll(async () => {
                const state = await getState(page);
                return `${state.currentMapId}:${state.serverMapId}`;
            })
            .toBe("greenwood_road:greenwood_road");

        const catchTask = await beginForestEncounter(page, "applepup");
        await advanceDialog(page, "Something wild jumps from the grass.", catchTask);
        await expect(dialogChoice(page, 0)).toContainText("Fight");
        await dialogChoice(page, 0).tap();
        await advanceDialog(page, /Attack: -\d+ HP/, catchTask);
        await expect(dialogChoice(page, 1)).toContainText("Catch");
        await dialogChoice(page, 1).tap();
        await advanceDialog(page, "Captured. It settles into the pod.", catchTask);
        await expect
            .poll(async () => {
                const status = await getTaskStatus(page, catchTask);
                return `${status?.done ?? false}:${status?.error ?? ""}`;
            })
            .toBe("true:");
        await expect
            .poll(async () => (await getParty(page)).map((member) => member.speciesId).join(","))
            .toBe("ashcat,applepup");

        await setLeadHp(page, 200);
        const rivalIntroTask = await beginEvent(page, "jan-ike");
        await advanceDialog(page, "You've made it past the village. Let's see what your companion can do.", rivalIntroTask);
        await advanceDialog(page, "I'm not going easy on you.", rivalIntroTask);
        await expect
            .poll(async () => {
                const status = await getTaskStatus(page, rivalIntroTask);
                return `${status?.done ?? false}:${status?.error ?? ""}`;
            })
            .toBe("true:");
        await setLeadHp(page, 200);
        await setEventHp(page, "jan-ike", 999);

        await page.evaluate(() =>
            window.__POKI__!.testing.moveServerPlayer({ x: 416, y: 88 }, "greenwood_road"),
        );
        await expect
            .poll(async () => {
                const state = await getCombatState(page, "jan-ike");
                const playerX = state.playerPosition.x ?? 0;
                const playerY = state.playerPosition.y ?? 0;
                const eventX = state.eventPosition.x ?? 448;
                const eventY = state.eventPosition.y ?? 88;
                return Math.hypot(eventX - playerX, eventY - playerY);
            })
            .toBeLessThanOrEqual(96);

        const movebar = page.getByTestId("lead-movebar");
        const target = page.getByTestId("lead-movebar-target");
        const move = page.getByTestId("lead-move-ember_nip");
        await expect(movebar).toBeVisible();
        await expect(target).toBeVisible();
        await expect(target).toContainText("jan ike");
        await expect(target).toHaveAttribute("data-in-range", "true");
        await expect(move).toBeVisible();
        await expect(move).toBeEnabled();
        await expect(move).toHaveAttribute("data-ready", "true");
        await expect(move).toHaveAttribute("aria-disabled", "false");
        await expectTouchTarget(move, "lead move ember_nip");
        await setLeadHp(page, 200);
        await expect
            .poll(async () => (await getParty(page)).map((member) => member.speciesId).join(","))
            .toBe("ashcat,applepup");
        await expect(page.locator("#rpg canvas")).toBeVisible();
        const reticlePath = await captureCanvasWithActiveReticle(
            page,
            testInfo,
            "mobile-combat-target-reticle",
        );
        expectActiveCombatReticle(reticlePath);
        await setLeadHp(page, 200);
        await expect
            .poll(async () => (await getParty(page)).map((member) => member.speciesId).join(","))
            .toBe("ashcat,applepup");

        await expect(page.getByTestId("lead-switch-panel")).toBeVisible();
        await expect(page.getByTestId("lead-switch-label")).toContainText("Party");
        await expect(page.getByTestId("lead-switch-slot-0")).toContainText("Ashcat");
        await expect(page.getByTestId("lead-switch-slot-0")).toHaveAttribute(
            "aria-disabled",
            "true",
        );
        const benchSwitch = page.getByTestId("lead-switch-slot-1");
        await expect(benchSwitch).toContainText("Applepup");
        await expect(benchSwitch).toHaveAttribute("aria-disabled", "false");
        await expectTouchTarget(benchSwitch, "lead switch slot 1");

        await benchSwitch.tap();
        await expect
            .poll(async () => (await getParty(page)).map((member) => member.speciesId).join(","))
            .toBe("applepup,ashcat");
        await expect
            .poll(async () => {
                const state = await getState(page);
                return state.serverGraphic;
            })
            .toBe("species_applepup");
        await expect(movebar).toContainText("Applepup");
        await expect(page.getByTestId("lead-move-leaf_jab")).toBeVisible();
        await expect(page.getByTestId("lead-move-quick_jab")).toBeVisible();
        await expect(page.getByTestId("lead-move-ember_nip")).toHaveCount(0);
        await setLeadHp(page, 200);

        const before = await getCombatState(page, "jan-ike");
        expect(before.eventHp).toBe(999);
        expect(before.playerSp).toBeGreaterThan(0);

        const activeMove = page.locator('[data-testid^="lead-move-"][data-ready="true"]').first();
        await expect(activeMove).toBeVisible();
        const activeMoveTestId = await activeMove.getAttribute("data-testid");
        expect(activeMoveTestId).not.toBeNull();
        const usedMove = page.locator(`[data-testid="${activeMoveTestId}"]`);
        await usedMove.tap();

        await expect
            .poll(async () => {
                const state = await getCombatState(page, "jan-ike");
                return state.eventHp ?? 60;
            })
            .toBeLessThan(before.eventHp ?? 60);
        await expect
            .poll(async () => {
                const state = await getCombatState(page, "jan-ike");
                return state.playerSp;
            })
            .toBeLessThan(before.playerSp ?? 0);
        await expect(usedMove).toHaveAttribute("data-ready", "false");
        await expect(usedMove).toHaveAttribute("aria-disabled", "true");

        await page.evaluate(() =>
            window.__POKI__!.testing.moveServerPlayer({ x: 192, y: 88 }, "greenwood_road"),
        );
        await setLeadHp(page, 200);
        await page.waitForTimeout(250);
        expect(pageErrors).toEqual([]);
        expect(consoleErrors).toEqual([]);
    } finally {
        await context.close();
    }
});
