import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { captureGoldenPathCheckpoint } from "./golden-path-diagnostics";

test.setTimeout(150_000);

type BrowserDebugState = {
    currentMapId: string | null;
    journeyBeat: string | null;
    starterChosen: string | null;
    serverMapId: string | null;
    serverGraphic: string | null;
    saves: Array<Record<string, unknown> | null>;
};

type BrowserPartyMember = {
    slot: number;
    speciesId: string;
    level: number;
    xp: number;
};

type BrowserEncounterLog = {
    speciesId: string;
    mapId: string;
    outcome: string;
};

type BrowserTaskStatus = {
    done: boolean;
    error: string | null;
};

type BrowserShapeTarget =
    | string
    | {
          name: string;
          properties?: Record<string, unknown>;
      };

const COMBAT_HUD_TEST_IDS = ["lead-movebar", "lead-movebar-target", "lead-switch-panel"];

async function waitForReady(page: Page): Promise<void> {
    await page.waitForFunction(() => window.__POKI__?.ready === true, {
        timeout: 30_000,
    });
}

async function getState(page: Page): Promise<BrowserDebugState> {
    return page.evaluate(() => window.__POKI__!.testing.getState());
}

async function getParty(page: Page): Promise<BrowserPartyMember[]> {
    return page.evaluate(() => window.__POKI__!.testing.getParty());
}

async function getFlag(page: Page, flagId: string): Promise<string | null> {
    return page.evaluate((id) => window.__POKI__!.testing.getFlag(id), flagId);
}

async function getInventoryCount(page: Page, itemId: string): Promise<number> {
    return page.evaluate((id) => window.__POKI__!.testing.getInventoryCount(id), itemId);
}

async function getLatestEncounter(page: Page): Promise<BrowserEncounterLog | null> {
    return page.evaluate(() => window.__POKI__!.testing.getLatestEncounter());
}

async function getTaskStatus(page: Page, taskId: string): Promise<BrowserTaskStatus | null> {
    return page.evaluate((id) => window.__POKI__!.testing.getTaskStatus(id), taskId);
}

async function expectTaskDone(page: Page, taskId: string): Promise<void> {
    await expect
        .poll(async () => {
            const status = await getTaskStatus(page, taskId);
            return `${status?.done ?? false}:${status?.error ?? ""}`;
        })
        .toBe("true:");
}

async function expectActionBattleReady(page: Page, taskId: string): Promise<void> {
    await expectTaskDone(page, taskId);
    await expect(page.getByTestId("lead-movebar")).toBeVisible();
    await expect
        .poll(async () => {
            const state = await getState(page);
            return state.serverGraphic;
        })
        .not.toBe("hero");
}

function titleEntry(page: Page, index: number) {
    return page.locator(".rpg-ui-title-screen-menu .rpg-ui-menu-item").nth(index);
}

function dialogChoice(page: Page, index: number) {
    return page.getByTestId(`dialog-choice-${index}`);
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

async function triggerEvent(
    page: Page,
    eventId: string,
    trigger: "action" | "touch" = "action",
): Promise<void> {
    await page.evaluate(
        ({ id, mode }) => {
            return window.__POKI__!.testing.triggerEvent(id, mode);
        },
        { id: eventId, mode: trigger },
    );
}

async function beginDefeatEvent(page: Page, eventId: string): Promise<string> {
    return page.evaluate((id) => {
        return window.__POKI__!.testing.beginDefeatEvent(id);
    }, eventId);
}

async function beginShape(
    page: Page,
    target: BrowserShapeTarget,
    randomValues: number[] = [],
): Promise<string> {
    return page.evaluate(
        ({ shape, values }) => {
            return window.__POKI__!.testing.beginShape(shape, { randomValues: values });
        },
        { shape: target, values: randomValues },
    );
}

async function advanceDialog(
    page: Page,
    expectedText: string | RegExp,
    taskId?: string,
): Promise<void> {
    await expectDialog(page, expectedText, taskId);
    await page.evaluate(() => window.__POKI__!.testing.closeGui("rpg-dialog"));
}

async function expectDialog(
    page: Page,
    expectedText: string | RegExp,
    taskId?: string,
): Promise<void> {
    const content = page.locator(".rpg-ui-dialog-content");
    if (typeof expectedText === "string" && taskId) {
        await expect
            .poll(async () => {
                const status = await getTaskStatus(page, taskId);
                if (status?.error) {
                    return `ERROR: ${status.error}`;
                }
                return (await content.textContent()) ?? "";
            })
            .toBe(expectedText);
    } else {
        await expect(content).toHaveText(expectedText);
    }
}

async function closeDialog(page: Page): Promise<void> {
    await page.evaluate(() => window.__POKI__!.testing.closeGui("rpg-dialog"));
}

test("browser golden path covers starter ceremony through the clear credits", async ({
    page,
}, testInfo) => {
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

    await page.goto("/");
    await waitForReady(page);

    await page.evaluate(() => window.__POKI__!.testing.resetPersistence({ includeSaves: true }));
    await page.reload();
    await waitForReady(page);

    await expect(page.locator(".rpg-ui-title-screen-title")).toContainText("poki soweli");
    await expect(titleEntry(page, 0)).toContainText("open sin");
    await captureGoldenPathCheckpoint(page, testInfo, {
        id: "01-title-menu",
        title: "Fresh title menu before new game",
        expectedVisibleTestIds: [],
        focus: [
            "Brand typography, title framing, menu spacing, and canvas background are coherent.",
            "No blank canvas, missing font, stretched art, or debug overlay is visible before play starts.",
        ],
    });
    await titleEntry(page, 0).click();

    await expect
        .poll(async () => {
            const state = await getState(page);
            return state.saves[0]?.map ?? null;
        })
        .toBe("ma_tomo_lili");

    const gatedWarpTask = await beginEvent(page, "warp_east", "touch");
    await advanceDialog(page, "hello", gatedWarpTask);
    await advanceDialog(page, "kili sin li pona tawa sijelo.", gatedWarpTask);
    await advanceDialog(page, "kule seme li pona tawa sina?", gatedWarpTask);
    await captureGoldenPathCheckpoint(page, testInfo, {
        id: "02-gated-starter-dialog",
        title: "Starter-gated east warp dialog",
        expectedMapId: "ma_tomo_lili",
        expectedHiddenTestIds: COMBAT_HUD_TEST_IDS,
        focus: [
            "Dialog chrome remains readable over the starter village.",
            "The player remains visibly placed on a walkable village tile while the gate blocks progress.",
        ],
    });

    await expect
        .poll(async () => {
            const state = await getState(page);
            return `${state.currentMapId}:${state.serverMapId}:${state.starterChosen}`;
        })
        .toBe("ma_tomo_lili:ma_tomo_lili:null");

    const starterTask = await beginEvent(page, "jan-sewi");
    await advanceDialog(page, "hello", starterTask);
    await advanceDialog(page, "kili sin li pona tawa sijelo.", starterTask);
    await advanceDialog(page, "kule seme li pona tawa sina?", starterTask);

    await expect(dialogChoice(page, 0)).toContainText("kon moli");
    await expect(dialogChoice(page, 1)).toContainText("telo jaki");
    await expect(dialogChoice(page, 2)).toContainText("jan ike lili");
    await captureGoldenPathCheckpoint(page, testInfo, {
        id: "03-starter-choice",
        title: "Starter ceremony choice dialog",
        expectedMapId: "ma_tomo_lili",
        expectedHiddenTestIds: COMBAT_HUD_TEST_IDS,
        focus: [
            "Starter choices are visually balanced, readable, and large enough for pointer/tap selection.",
            "Village tiles behind the dialog still read as the same coherent town palette.",
        ],
    });
    await dialogChoice(page, 0).click();

    await expect
        .poll(async () => {
            const state = await getState(page);
            return state.starterChosen;
        })
        .toBe("kon_moli");
    await expect.poll(async () => getFlag(page, "starter_chosen")).toBe("1");
    await expect.poll(async () => getInventoryCount(page, "poki_lili")).toBe(3);
    await expect
        .poll(async () => {
            const party = await getParty(page);
            return JSON.stringify(party);
        })
        .toBe(
            JSON.stringify([
                {
                    slot: 0,
                    speciesId: "kon_moli",
                    level: 5,
                    xp: 0,
                },
            ]),
        );
    await captureGoldenPathCheckpoint(page, testInfo, {
        id: "04-starter-selected-village",
        title: "Starter selected on the village map",
        expectedMapId: "ma_tomo_lili",
        expectedHiddenTestIds: COMBAT_HUD_TEST_IDS,
        focus: [
            "Hero placement is not inside village collision or NPC/object overlap.",
            "HUD/menu affordance frames gameplay without hiding the player or next route.",
        ],
    });

    const unlockedWarpTask = await beginEvent(page, "warp_east", "touch");
    await expect(page.getByTestId("warp-loading")).toContainText("nasin wan");
    await expect(page.getByTestId("warp-loading")).toHaveAttribute("data-phase", /enter|settle/);
    await captureGoldenPathCheckpoint(page, testInfo, {
        id: "05-first-warp-loading",
        title: "First unlocked warp loading overlay",
        expectedVisibleTestIds: ["warp-loading"],
        expectedHiddenTestIds: COMBAT_HUD_TEST_IDS,
        allowMapMismatch: true,
        focus: [
            "Warp overlay branding, destination label, and fade state are legible during map transition.",
            "No stale dialog or combat chrome leaks into the loading state.",
        ],
    });
    await expect
        .poll(async () => {
            const status = await getTaskStatus(page, unlockedWarpTask);
            return status?.done ?? false;
        })
        .toBe(true);
    await expect(page.getByTestId("warp-loading")).toBeHidden();
    await expect
        .poll(async () => {
            const state = await getState(page);
            return `${state.currentMapId}:${state.serverMapId}`;
        })
        .toBe("nasin_wan:nasin_wan");
    await captureGoldenPathCheckpoint(page, testInfo, {
        id: "06-forest-entry",
        title: "Forest route entry after first warp",
        expectedMapId: "nasin_wan",
        expectedHiddenTestIds: ["warp-loading", ...COMBAT_HUD_TEST_IDS],
        focus: [
            "Forest palette reads as a new biome while staying in the Fan-tasy visual family.",
            "Warp landing places the player on a walkable path, not inside trees, cliffs, or NPC collision.",
        ],
    });

    const encounterTask = await beginShape(
        page,
        {
            name: "encounter_0",
            properties: {
                type: "Encounter",
                species:
                    '{"jan_ike_lili":25,"jan_utala_lili":20,"soweli_musi":20,"soweli_kili":15,"soweli_jaki":10,"waso_pimeja":10}',
                level_min: 3,
                level_max: 5,
            },
        },
        Array.from({ length: 16 }, () => 0),
    );
    await advanceDialog(page, "sina soweli.", encounterTask);

    await expect(page.getByTestId("wild-battle")).toBeVisible();
    await expect(page.getByTestId("wild-battle-lead")).toContainText("kon moli");
    await expect(page.getByTestId("wild-battle-target")).toContainText("jan ike lili");
    await expect(dialogChoice(page, 0)).toContainText("utala");
    await expect(dialogChoice(page, 1)).toContainText("poki");
    await expect(dialogChoice(page, 2)).toContainText("ijo");
    await expect(dialogChoice(page, 3)).toContainText("tawa");
    await captureGoldenPathCheckpoint(page, testInfo, {
        id: "07-wild-battle-open",
        title: "Wild encounter action menu opens",
        expectedMapId: "nasin_wan",
        expectedVisibleTestIds: ["wild-battle", "wild-battle-lead", "wild-battle-target"],
        expectedHiddenTestIds: COMBAT_HUD_TEST_IDS,
        focus: [
            "Wild battle overlay cards align with lead and target species identity.",
            "Dialog choices, HP cards, and map background do not visually compete.",
        ],
    });
    await dialogChoice(page, 0).click();

    await expect(page.getByTestId("wild-battle-damage")).toContainText(/-\d+ HP/);
    await captureGoldenPathCheckpoint(page, testInfo, {
        id: "08-wild-battle-damage",
        title: "Wild encounter damage feedback",
        expectedMapId: "nasin_wan",
        expectedVisibleTestIds: ["wild-battle", "wild-battle-damage"],
        expectedHiddenTestIds: COMBAT_HUD_TEST_IDS,
        focus: [
            "Damage label is readable, spatially attached to the combat card, and not clipped by dialog.",
            "HP bar and target card state visually match the attack result.",
        ],
    });
    await advanceDialog(page, /utala: -\d+ HP/, encounterTask);
    await expect(dialogChoice(page, 1)).toContainText("poki");
    await dialogChoice(page, 1).click();

    await expect(page.getByTestId("wild-battle-capture")).toContainText("poki li tawa");
    await expect(page.getByTestId("wild-battle-capture")).toContainText("poki li awen");
    await captureGoldenPathCheckpoint(page, testInfo, {
        id: "09-capture-feedback",
        title: "Capture throw and caught feedback",
        expectedMapId: "nasin_wan",
        expectedVisibleTestIds: ["wild-battle", "wild-battle-capture"],
        expectedHiddenTestIds: COMBAT_HUD_TEST_IDS,
        focus: [
            "Capture feedback is visibly staged and not hidden by the choice menu.",
            "Creature/card scale stays consistent with the map and HUD.",
        ],
    });
    await advanceDialog(page, "a. pona.", encounterTask);
    await expect
        .poll(async () => {
            const status = await getTaskStatus(page, encounterTask);
            return status?.done ?? false;
        })
        .toBe(true);
    await expect(page.getByTestId("wild-battle")).toBeHidden();
    await captureGoldenPathCheckpoint(page, testInfo, {
        id: "10-post-catch-forest",
        title: "Forest returns to overworld after first catch",
        expectedMapId: "nasin_wan",
        expectedHiddenTestIds: ["wild-battle", ...COMBAT_HUD_TEST_IDS],
        focus: [
            "Wild-battle chrome fully tears down and leaves no visual residue on the map.",
            "Player remains in a plausible walkable forest/encounter area after the capture.",
        ],
    });

    await expect
        .poll(async () => {
            const party = await getParty(page);
            return JSON.stringify(party);
        })
        .toBe(
            JSON.stringify([
                {
                    slot: 0,
                    speciesId: "kon_moli",
                    level: 5,
                    xp: 152,
                },
                {
                    slot: 1,
                    speciesId: "jan_ike_lili",
                    level: 3,
                    xp: 0,
                },
            ]),
        );
    await expect
        .poll(async () => JSON.stringify(await getLatestEncounter(page)))
        .toBe(
            JSON.stringify({
                speciesId: "jan_ike_lili",
                mapId: "nasin_wan",
                outcome: "caught",
            }),
        );
    await expect.poll(async () => getInventoryCount(page, "poki_lili")).toBe(2);
    await expect
        .poll(async () => {
            const state = await getState(page);
            return state.journeyBeat;
        })
        .toBe("beat_01_ma_tomo_lili");

    const rivalIntroTask = await beginEvent(page, "jan-ike");
    await advanceDialog(page, "mi mute o lukin!", rivalIntroTask);
    await advanceDialog(page, "mi ala.", rivalIntroTask);
    await expect
        .poll(async () => {
            const state = await getState(page);
            return state.serverGraphic;
        })
        .toBe("species_kon_moli");
    await expectTaskDone(page, rivalIntroTask);
    await expect(page.getByTestId("lead-movebar")).toBeVisible();
    await captureGoldenPathCheckpoint(page, testInfo, {
        id: "11-rival-lead-avatar",
        title: "Rival battle uses lead creature avatar",
        expectedMapId: "nasin_wan",
        expectedVisibleTestIds: ["lead-movebar"],
        focus: [
            "Lead creature battle sprite replaces the field hero clearly and at the correct scale.",
            "Action-battle HUD/movebar frames the target without obscuring terrain or sprites.",
        ],
    });

    const rivalDefeatTask = await beginDefeatEvent(page, "jan-ike");
    await advanceDialog(page, "sina pini pona.", rivalDefeatTask);
    await advanceDialog(page, "mi mute o tawa!", rivalDefeatTask);

    await expect.poll(async () => getFlag(page, "jan_ike_defeated")).toBe("1");
    await expect
        .poll(async () => {
            const state = await getState(page);
            return state.journeyBeat;
        })
        .toBe("beat_03_nena_sewi");
    await expect
        .poll(async () => {
            const state = await getState(page);
            return state.serverGraphic;
        })
        .toBe("hero");
    await captureGoldenPathCheckpoint(page, testInfo, {
        id: "12-post-rival-hero-restored",
        title: "Hero restored after rival victory",
        expectedMapId: "nasin_wan",
        expectedHiddenTestIds: COMBAT_HUD_TEST_IDS,
        focus: [
            "Field hero graphic returns after action-battle without stale combat sprite artifacts.",
            "Forest route still looks visually consistent after combat teardown.",
        ],
    });

    await triggerEvent(page, "warp_east", "touch");
    await expect
        .poll(async () => {
            const state = await getState(page);
            return `${state.currentMapId}:${state.serverMapId}`;
        })
        .toBe("nena_sewi:nena_sewi");
    await captureGoldenPathCheckpoint(page, testInfo, {
        id: "13-mountain-pass-entry",
        title: "Mountain pass entry",
        expectedMapId: "nena_sewi",
        expectedHiddenTestIds: COMBAT_HUD_TEST_IDS,
        focus: [
            "Mountain/cliff tiles face the correct direction and read as blocked where they should.",
            "Warp landing does not place the player inside cliff, rock, tree, or NPC collision.",
        ],
    });

    const gymIntroTask = await beginEvent(page, "jan-wawa");
    await advanceDialog(page, "mi wawa mute!", gymIntroTask);
    await advanceDialog(page, "mi mute o lukin!", gymIntroTask);
    await expectActionBattleReady(page, gymIntroTask);

    const gymDefeatTask = await beginDefeatEvent(page, "jan-wawa");
    await advanceDialog(page, "sina pini pona.", gymDefeatTask);
    await advanceDialog(page, "lukin la sina pilin pona...", gymDefeatTask);

    await expect.poll(async () => getFlag(page, "badge_sewi")).toBe("1");
    await expect
        .poll(async () => {
            const state = await getState(page);
            return state.journeyBeat;
        })
        .toBe("beat_04_ma_telo");
    await expect
        .poll(async () => {
            const party = await getParty(page);
            return JSON.stringify(party);
        })
        .toBe(
            JSON.stringify([
                {
                    slot: 0,
                    speciesId: "kon_moli",
                    level: 7,
                    xp: 372,
                },
                {
                    slot: 1,
                    speciesId: "jan_ike_lili",
                    level: 3,
                    xp: 0,
                },
            ]),
        );

    await triggerEvent(page, "warp_north", "touch");
    await expect
        .poll(async () => {
            const state = await getState(page);
            return `${state.currentMapId}:${state.serverMapId}`;
        })
        .toBe("ma_telo:ma_telo");
    await expect.poll(async () => getInventoryCount(page, "ma")).toBe(10);
    await captureGoldenPathCheckpoint(page, testInfo, {
        id: "14-lake-town-entry",
        title: "Lake town entry before shop",
        expectedMapId: "ma_telo",
        expectedHiddenTestIds: COMBAT_HUD_TEST_IDS,
        focus: [
            "Lake-town palette, water/shore edges, buildings, and path tiles are coherent.",
            "Player spawn and shop approach remain walkable and visually obvious.",
        ],
    });

    const shopTask = await beginEvent(page, "jan-moku");
    await advanceDialog(page, "kili sin li pona tawa sijelo.", shopTask);

    await expect(dialogChoice(page, 0)).toContainText("poki lili ×1");
    await expect(dialogChoice(page, 1)).toContainText("kili ×1");
    await captureGoldenPathCheckpoint(page, testInfo, {
        id: "15-shop-menu",
        title: "jan Moku shop menu",
        expectedMapId: "ma_telo",
        expectedHiddenTestIds: COMBAT_HUD_TEST_IDS,
        focus: [
            "Shop dialog choices are readable, consistently styled, and do not cover the NPC/player relationship confusingly.",
            "Lake-town background behind the shop still reads as intentional map composition.",
        ],
    });
    await dialogChoice(page, 0).click();
    await advanceDialog(page, /poki lili \+1\s+ma 8/, shopTask);

    await expect(dialogChoice(page, 1)).toContainText("kili ×1");
    await dialogChoice(page, 1).click();
    await advanceDialog(page, /kili \+1\s+ma 7/, shopTask);

    await expect(dialogChoice(page, 2)).toContainText("telo pona ×1");
    await expect(dialogChoice(page, 3)).toContainText("poki wawa ×1");
    await expect(dialogChoice(page, 4)).toContainText("tawa");
    await dialogChoice(page, 4).click();
    await expect
        .poll(async () => {
            const status = await getTaskStatus(page, shopTask);
            return status?.done ?? false;
        })
        .toBe(true);
    await expect.poll(async () => getInventoryCount(page, "ma")).toBe(7);
    await expect.poll(async () => getInventoryCount(page, "poki_lili")).toBe(3);
    await expect.poll(async () => getInventoryCount(page, "kili")).toBe(2);

    const lakeGymIntroTask = await beginEvent(page, "jan-telo");
    await advanceDialog(page, "mi mute o lukin!", lakeGymIntroTask);
    await advanceDialog(page, "mi wawa mute!", lakeGymIntroTask);
    await expectActionBattleReady(page, lakeGymIntroTask);

    const lakeGymDefeatTask = await beginDefeatEvent(page, "jan-telo");
    await advanceDialog(page, "sina pini pona.", lakeGymDefeatTask);
    await advanceDialog(page, "mi mute o tawa!", lakeGymDefeatTask);

    await expect.poll(async () => getFlag(page, "badge_telo")).toBe("1");
    await expect
        .poll(async () => {
            const state = await getState(page);
            return state.journeyBeat;
        })
        .toBe("beat_05_ma_lete");
    await expect
        .poll(async () => {
            const party = await getParty(page);
            return JSON.stringify(party);
        })
        .toBe(
            JSON.stringify([
                {
                    slot: 0,
                    speciesId: "kon_moli",
                    level: 8,
                    xp: 522,
                },
                {
                    slot: 1,
                    speciesId: "jan_ike_lili",
                    level: 3,
                    xp: 0,
                },
            ]),
        );

    await triggerEvent(page, "warp_north", "touch");
    await expect
        .poll(async () => {
            const state = await getState(page);
            return `${state.currentMapId}:${state.serverMapId}`;
        })
        .toBe("ma_lete:ma_lete");
    await captureGoldenPathCheckpoint(page, testInfo, {
        id: "16-ice-village-entry",
        title: "Ice village entry",
        expectedMapId: "ma_lete",
        expectedHiddenTestIds: COMBAT_HUD_TEST_IDS,
        focus: [
            "Snow/ice palette is visually distinct from lake town while staying in the same art family.",
            "Snow landmarks, roads, and collision edges are not rotated or visually contradictory.",
        ],
    });

    const coldGymIntroTask = await beginEvent(page, "jan-lete");
    await advanceDialog(page, "mi mute o lukin!", coldGymIntroTask);
    await advanceDialog(page, "mi wawa mute!", coldGymIntroTask);
    await expectActionBattleReady(page, coldGymIntroTask);

    const coldGymDefeatTask = await beginDefeatEvent(page, "jan-lete");
    await advanceDialog(page, "sina pini pona.", coldGymDefeatTask);
    await advanceDialog(page, "mi mute o tawa!", coldGymDefeatTask);

    await expect.poll(async () => getFlag(page, "badge_lete")).toBe("1");
    await expect
        .poll(async () => {
            const state = await getState(page);
            return state.journeyBeat;
        })
        .toBe("beat_06_nena_suli");
    await expect
        .poll(async () => {
            const party = await getParty(page);
            return JSON.stringify(party);
        })
        .toBe(
            JSON.stringify([
                {
                    slot: 0,
                    speciesId: "kon_moli",
                    level: 8,
                    xp: 702,
                },
                {
                    slot: 1,
                    speciesId: "jan_ike_lili",
                    level: 3,
                    xp: 0,
                },
            ]),
        );

    await triggerEvent(page, "warp_north", "touch");
    await expect
        .poll(async () => {
            const state = await getState(page);
            return `${state.currentMapId}:${state.serverMapId}`;
        })
        .toBe("nena_suli:nena_suli");
    await captureGoldenPathCheckpoint(page, testInfo, {
        id: "17-cave-shrine-entry",
        title: "Cave shrine entry",
        expectedMapId: "nena_suli",
        expectedHiddenTestIds: COMBAT_HUD_TEST_IDS,
        focus: [
            "Cave walls, shrine floor, torches, and blocked slopes face correctly and feel cohesive.",
            "Player entry is not embedded in cave wall collision or decorative blockers.",
        ],
    });

    const peakGymIntroTask = await beginEvent(page, "jan-suli");
    await advanceDialog(page, "mi mute o lukin!", peakGymIntroTask);
    await advanceDialog(page, "mi wawa mute!", peakGymIntroTask);
    await expectActionBattleReady(page, peakGymIntroTask);

    const peakGymDefeatTask = await beginDefeatEvent(page, "jan-suli");
    await advanceDialog(page, "lukin la sina pilin pona...", peakGymDefeatTask);
    await advanceDialog(page, "mi mute o tawa!", peakGymDefeatTask);

    await expect.poll(async () => getFlag(page, "badge_suli")).toBe("1");
    await expect
        .poll(async () => {
            const state = await getState(page);
            return state.journeyBeat;
        })
        .toBe("beat_07_nasin_pi_telo");
    await expect
        .poll(async () => {
            const party = await getParty(page);
            return JSON.stringify(party);
        })
        .toBe(
            JSON.stringify([
                {
                    slot: 0,
                    speciesId: "kon_moli",
                    level: 9,
                    xp: 922,
                },
                {
                    slot: 1,
                    speciesId: "jan_ike_lili",
                    level: 3,
                    xp: 0,
                },
            ]),
        );

    await triggerEvent(page, "warp_north", "touch");
    await expect
        .poll(async () => {
            const state = await getState(page);
            return `${state.currentMapId}:${state.serverMapId}:${state.journeyBeat}`;
        })
        .toBe("nasin_pi_telo:nasin_pi_telo:beat_07_nasin_pi_telo");
    await captureGoldenPathCheckpoint(page, testInfo, {
        id: "18-final-water-route-entry",
        title: "Final water route entry",
        expectedMapId: "nasin_pi_telo",
        expectedHiddenTestIds: COMBAT_HUD_TEST_IDS,
        focus: [
            "Water, shore, sandbar, and pier tiles face the correct direction and communicate blocked/open terrain.",
            "Final-route composition points toward the green dragon without visual noise.",
        ],
    });

    const finalBossIntroTask = await beginShape(page, {
        name: "final_boss_trigger",
        properties: {
            target_event: "green_dragon",
            required_flag: "badges_all_four",
        },
    });
    await advanceDialog(page, "mi wawa mute!", finalBossIntroTask);
    await expectActionBattleReady(page, finalBossIntroTask);
    await captureGoldenPathCheckpoint(page, testInfo, {
        id: "19-green-dragon-combat-intro",
        title: "Green dragon combat intro",
        expectedMapId: "nasin_pi_telo",
        expectedVisibleTestIds: ["lead-movebar"],
        focus: [
            "Green dragon set-piece reads as endgame scale and does not reuse mid-game visual language accidentally.",
            "Combat HUD, target reticle, and final-route map do not obscure each other.",
        ],
    });

    const finalBossDefeatTask = await beginDefeatEvent(page, "green-dragon");
    await advanceDialog(page, "a. pona.", finalBossDefeatTask);
    await expectDialog(page, /poki soweli\s+thanks for playing\./, finalBossDefeatTask);
    await captureGoldenPathCheckpoint(page, testInfo, {
        id: "20-ending-credits-title",
        title: "Ending credits title page",
        expectedMapId: "nasin_pi_telo",
        expectedHiddenTestIds: COMBAT_HUD_TEST_IDS,
        focus: [
            "Credits typography, spacing, and contrast match the game brand.",
            "Final clear state does not leave combat overlays visually stuck behind the credits.",
        ],
    });
    await closeDialog(page);
    await expectDialog(
        page,
        /game \/ code \/ maps\s+project team\s+engine\s+RPGJS \/ CanvasEngine \/ Pixi/,
        finalBossDefeatTask,
    );
    await captureGoldenPathCheckpoint(page, testInfo, {
        id: "21-ending-credits-team",
        title: "Ending credits team page",
        expectedMapId: "nasin_pi_telo",
        expectedHiddenTestIds: COMBAT_HUD_TEST_IDS,
        focus: [
            "Credits page two remains readable and consistently aligned after paging.",
            "No map, dialog, or combat element leaks into the foreground unexpectedly.",
        ],
    });
    await closeDialog(page);
    await expectDialog(
        page,
        /art \/ tiles \/ creatures\s+Fan-tasy asset family\s+language corpus\s+Tatoeba/,
        finalBossDefeatTask,
    );
    await captureGoldenPathCheckpoint(page, testInfo, {
        id: "22-ending-credits-art",
        title: "Ending credits art and corpus page",
        expectedMapId: "nasin_pi_telo",
        expectedHiddenTestIds: COMBAT_HUD_TEST_IDS,
        focus: [
            "Credits page three preserves the same visual identity and text rhythm.",
            "The golden path reaches a stable final visual state with no page or console errors.",
        ],
    });
    await closeDialog(page);

    await expect.poll(async () => getFlag(page, "green_dragon_defeated")).toBe("1");
    await expect.poll(async () => getFlag(page, "game_cleared")).toBe("1");
    await expect
        .poll(async () => {
            const state = await getState(page);
            return state.journeyBeat;
        })
        .toBe("ending");
    await expect
        .poll(async () => {
            const status = await getTaskStatus(page, finalBossDefeatTask);
            return status?.done ?? false;
        })
        .toBe(true);
    await expect
        .poll(async () => {
            const status = await getTaskStatus(page, finalBossDefeatTask);
            return status?.error ?? null;
        })
        .toBeNull();

    await page.waitForTimeout(250);
    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
});
