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
    return page.locator(".rr-title-entry").nth(index);
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
    const content = page.locator('[data-testid="rr-dialog-content"]');
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

    await expect(page.locator('[data-testid="rr-title-title"]')).toContainText("Rivers Reckoning");
    await expect(titleEntry(page, 0)).toContainText("New Game");
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
        .toBe("riverside_home");

    const gatedWarpTask = await beginEvent(page, "warp_east", "touch");
    await advanceDialog(page, "Rivers, today you start your own investigation.", gatedWarpTask);
    await advanceDialog(page, "Three creatures answered the call.", gatedWarpTask);
    await advanceDialog(page, "Choose the partner you trust at your side.", gatedWarpTask);
    await captureGoldenPathCheckpoint(page, testInfo, {
        id: "02-gated-starter-dialog",
        title: "Starter-gated east warp dialog",
        expectedMapId: "riverside_home",
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
        .toBe("riverside_home:riverside_home:null");

    const starterTask = await beginEvent(page, "jan-sewi");
    await advanceDialog(page, "Rivers, today you start your own investigation.", starterTask);
    await advanceDialog(page, "Three creatures answered the call.", starterTask);
    await advanceDialog(page, "Choose the partner you trust at your side.", starterTask);

    await expect(dialogChoice(page, 0)).toContainText("Ashcat");
    await expect(dialogChoice(page, 1)).toContainText("Mireling");
    await expect(dialogChoice(page, 2)).toContainText("Bramble Imp");
    await captureGoldenPathCheckpoint(page, testInfo, {
        id: "03-starter-choice",
        title: "Starter ceremony choice dialog",
        expectedMapId: "riverside_home",
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
        .toBe("ashcat");
    await expect.poll(async () => getFlag(page, "starter_chosen")).toBe("1");
    await expect.poll(async () => getInventoryCount(page, "capture_pod")).toBe(3);
    await expect
        .poll(async () => {
            const party = await getParty(page);
            return JSON.stringify(party);
        })
        .toBe(
            JSON.stringify([
                {
                    slot: 0,
                    speciesId: "ashcat",
                    level: 5,
                    xp: 0,
                },
            ]),
        );
    await captureGoldenPathCheckpoint(page, testInfo, {
        id: "04-starter-selected-village",
        title: "Starter selected on the village map",
        expectedMapId: "riverside_home",
        expectedHiddenTestIds: COMBAT_HUD_TEST_IDS,
        focus: [
            "Hero placement is not inside village collision or NPC/object overlap.",
            "HUD/menu affordance frames gameplay without hiding the player or next route.",
        ],
    });

    const unlockedWarpTask = await beginEvent(page, "warp_east", "touch");
    await expect(page.getByTestId("warp-loading")).toContainText("Greenwood Road");
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
        .toBe("greenwood_road:greenwood_road");
    await captureGoldenPathCheckpoint(page, testInfo, {
        id: "06-forest-entry",
        title: "Forest route entry after first warp",
        expectedMapId: "greenwood_road",
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
                    '{"bramble_imp":25,"thornling":20,"mirthcat":20,"applepup":15,"mudgrub":10,"nightjar":10}',
                level_min: 3,
                level_max: 5,
            },
        },
        Array.from({ length: 16 }, () => 0),
    );
    await advanceDialog(page, "Something wild jumps from the grass.", encounterTask);

    await expect(page.getByTestId("wild-battle")).toBeVisible();
    await expect(page.getByTestId("wild-battle-lead")).toContainText("Ashcat");
    await expect(page.getByTestId("wild-battle-target")).toContainText("Bramble Imp");
    await expect(dialogChoice(page, 0)).toContainText("Fight");
    await expect(dialogChoice(page, 1)).toContainText("Catch");
    await expect(dialogChoice(page, 2)).toContainText("Item");
    await expect(dialogChoice(page, 3)).toContainText("Run");
    await captureGoldenPathCheckpoint(page, testInfo, {
        id: "07-wild-battle-open",
        title: "Wild encounter action menu opens",
        expectedMapId: "greenwood_road",
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
        expectedMapId: "greenwood_road",
        expectedVisibleTestIds: ["wild-battle", "wild-battle-damage"],
        expectedHiddenTestIds: COMBAT_HUD_TEST_IDS,
        focus: [
            "Damage label is readable, spatially attached to the combat card, and not clipped by dialog.",
            "HP bar and target card state visually match the attack result.",
        ],
    });
    await advanceDialog(page, /Attack: -\d+ HP/, encounterTask);
    await expect(dialogChoice(page, 1)).toContainText("Catch");
    await dialogChoice(page, 1).click();

    await expect(page.getByTestId("wild-battle-capture")).toContainText("Throw!");
    await expect(page.getByTestId("wild-battle-capture")).toContainText("Caught!");
    await captureGoldenPathCheckpoint(page, testInfo, {
        id: "09-capture-feedback",
        title: "Capture throw and caught feedback",
        expectedMapId: "greenwood_road",
        expectedVisibleTestIds: ["wild-battle", "wild-battle-capture"],
        expectedHiddenTestIds: COMBAT_HUD_TEST_IDS,
        focus: [
            "Capture feedback is visibly staged and not hidden by the choice menu.",
            "Creature/card scale stays consistent with the map and HUD.",
        ],
    });
    await advanceDialog(page, "Captured. It settles into the pod.", encounterTask);
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
        expectedMapId: "greenwood_road",
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
                    speciesId: "ashcat",
                    level: 5,
                    xp: 152,
                },
                {
                    slot: 1,
                    speciesId: "bramble_imp",
                    level: 3,
                    xp: 0,
                },
            ]),
        );
    await expect
        .poll(async () => JSON.stringify(await getLatestEncounter(page)))
        .toBe(
            JSON.stringify({
                speciesId: "bramble_imp",
                mapId: "greenwood_road",
                outcome: "caught",
            }),
        );
    await expect.poll(async () => getInventoryCount(page, "capture_pod")).toBe(2);
    await expect
        .poll(async () => {
            const state = await getState(page);
            return state.journeyBeat;
        })
        .toBe("beat_01_riverside_home");

    const rivalIntroTask = await beginEvent(page, "jan-ike");
    await advanceDialog(page, "You've made it past the village. Let's see what your companion can do.", rivalIntroTask);
    await advanceDialog(page, "I'm not going easy on you.", rivalIntroTask);
    await expect
        .poll(async () => {
            const state = await getState(page);
            return state.serverGraphic;
        })
        .toBe("species_ashcat");
    await expectTaskDone(page, rivalIntroTask);
    await expect(page.getByTestId("lead-movebar")).toBeVisible();
    await captureGoldenPathCheckpoint(page, testInfo, {
        id: "11-rival-lead-avatar",
        title: "Rival battle uses lead creature avatar",
        expectedMapId: "greenwood_road",
        expectedVisibleTestIds: ["lead-movebar"],
        focus: [
            "Lead creature battle sprite replaces the field hero clearly and at the correct scale.",
            "Action-battle HUD/movebar frames the target without obscuring terrain or sprites.",
        ],
    });

    const rivalDefeatTask = await beginDefeatEvent(page, "jan-ike");
    await advanceDialog(page, "You handled yourself.", rivalDefeatTask);
    await advanceDialog(page, "Greenwood Road is yours.", rivalDefeatTask);

    await expect.poll(async () => getFlag(page, "rook_defeated")).toBe("1");
    await expect
        .poll(async () => {
            const state = await getState(page);
            return state.journeyBeat;
        })
        .toBe("beat_03_highridge_pass");
    await expect
        .poll(async () => {
            const state = await getState(page);
            return state.serverGraphic;
        })
        .toBe("hero");
    await captureGoldenPathCheckpoint(page, testInfo, {
        id: "12-post-rival-hero-restored",
        title: "Hero restored after rival victory",
        expectedMapId: "greenwood_road",
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
        .toBe("highridge_pass:highridge_pass");
    await captureGoldenPathCheckpoint(page, testInfo, {
        id: "13-mountain-pass-entry",
        title: "Mountain pass entry",
        expectedMapId: "highridge_pass",
        expectedHiddenTestIds: COMBAT_HUD_TEST_IDS,
        focus: [
            "Mountain/cliff tiles face the correct direction and read as blocked where they should.",
            "Warp landing does not place the player inside cliff, rock, tree, or NPC collision.",
        ],
    });

    const gymIntroTask = await beginEvent(page, "jan-wawa");
    await advanceDialog(page, "The pass belongs to teams that can take a hit.", gymIntroTask);
    await advanceDialog(page, "Stand firm.", gymIntroTask);
    await expectActionBattleReady(page, gymIntroTask);

    const gymDefeatTask = await beginDefeatEvent(page, "jan-wawa");
    await advanceDialog(page, "You took the hit and kept going.", gymDefeatTask);
    await advanceDialog(page, "Highridge Pass is open.", gymDefeatTask);

    await expect.poll(async () => getFlag(page, "badge_highridge")).toBe("1");
    await expect
        .poll(async () => {
            const state = await getState(page);
            return state.journeyBeat;
        })
        .toBe("beat_04_lakehaven");
    await expect
        .poll(async () => {
            const party = await getParty(page);
            return JSON.stringify(party);
        })
        .toBe(
            JSON.stringify([
                {
                    slot: 0,
                    speciesId: "ashcat",
                    level: 7,
                    xp: 372,
                },
                {
                    slot: 1,
                    speciesId: "bramble_imp",
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
        .toBe("lakehaven:lakehaven");
    await expect.poll(async () => getInventoryCount(page, "trail_token")).toBe(10);
    await captureGoldenPathCheckpoint(page, testInfo, {
        id: "14-lake-town-entry",
        title: "Lake town entry before shop",
        expectedMapId: "lakehaven",
        expectedHiddenTestIds: COMBAT_HUD_TEST_IDS,
        focus: [
            "Lake-town palette, water/shore edges, buildings, and path tiles are coherent.",
            "Player spawn and shop approach remain walkable and visually obvious.",
        ],
    });

    const shopTask = await beginEvent(page, "jan-moku");
    await advanceDialog(page, "Fruit, pods, and tonics. Nothing fancy, all useful.", shopTask);

    await expect(dialogChoice(page, 0)).toContainText("Capture Pod ×1");
    await expect(dialogChoice(page, 1)).toContainText("Orchard Fruit ×1");
    await captureGoldenPathCheckpoint(page, testInfo, {
        id: "15-shop-menu",
        title: "jan Moku shop menu",
        expectedMapId: "lakehaven",
        expectedHiddenTestIds: COMBAT_HUD_TEST_IDS,
        focus: [
            "Shop dialog choices are readable, consistently styled, and do not cover the NPC/player relationship confusingly.",
            "Lake-town background behind the shop still reads as intentional map composition.",
        ],
    });
    await dialogChoice(page, 0).click();
    await advanceDialog(page, /Capture Pod \+1\s+Trail Token 8/, shopTask);

    await expect(dialogChoice(page, 1)).toContainText("Orchard Fruit ×1");
    await dialogChoice(page, 1).click();
    await advanceDialog(page, /Orchard Fruit \+1\s+Trail Token 7/, shopTask);

    await expect(dialogChoice(page, 2)).toContainText("Spring Tonic ×1");
    await expect(dialogChoice(page, 3)).toContainText("Heavy Capture Pod ×1");
    await expect(dialogChoice(page, 4)).toContainText("Back");
    await dialogChoice(page, 4).click();
    await expect
        .poll(async () => {
            const status = await getTaskStatus(page, shopTask);
            return status?.done ?? false;
        })
        .toBe(true);
    await expect.poll(async () => getInventoryCount(page, "trail_token")).toBe(7);
    await expect.poll(async () => getInventoryCount(page, "capture_pod")).toBe(3);
    await expect.poll(async () => getInventoryCount(page, "orchard_fruit")).toBe(2);

    const lakeGymIntroTask = await beginEvent(page, "jan-telo");
    await advanceDialog(page, "Lakehaven watches the water and the trainer.", lakeGymIntroTask);
    await advanceDialog(page, "Let's see if you can read both.", lakeGymIntroTask);
    await expectActionBattleReady(page, lakeGymIntroTask);

    const lakeGymDefeatTask = await beginDefeatEvent(page, "jan-telo");
    await advanceDialog(page, "You stayed calm under pressure.", lakeGymDefeatTask);
    await advanceDialog(page, "Take the lake badge.", lakeGymDefeatTask);

    await expect.poll(async () => getFlag(page, "badge_lakehaven")).toBe("1");
    await expect
        .poll(async () => {
            const state = await getState(page);
            return state.journeyBeat;
        })
        .toBe("beat_05_frostvale");
    await expect
        .poll(async () => {
            const party = await getParty(page);
            return JSON.stringify(party);
        })
        .toBe(
            JSON.stringify([
                {
                    slot: 0,
                    speciesId: "ashcat",
                    level: 8,
                    xp: 522,
                },
                {
                    slot: 1,
                    speciesId: "bramble_imp",
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
        .toBe("frostvale:frostvale");
    await captureGoldenPathCheckpoint(page, testInfo, {
        id: "16-ice-village-entry",
        title: "Ice village entry",
        expectedMapId: "frostvale",
        expectedHiddenTestIds: COMBAT_HUD_TEST_IDS,
        focus: [
            "Snow/ice palette is visually distinct from lake town while staying in the same art family.",
            "Snow landmarks, roads, and collision edges are not rotated or visually contradictory.",
        ],
    });

    const coldGymIntroTask = await beginEvent(page, "jan-lete");
    await advanceDialog(page, "Frostvale tests patience first.", coldGymIntroTask);
    await advanceDialog(page, "Show me your warmest heart.", coldGymIntroTask);
    await expectActionBattleReady(page, coldGymIntroTask);

    const coldGymDefeatTask = await beginDefeatEvent(page, "jan-lete");
    await advanceDialog(page, "You kept moving through the cold.", coldGymDefeatTask);
    await advanceDialog(page, "Carry this badge onward.", coldGymDefeatTask);

    await expect.poll(async () => getFlag(page, "badge_frostvale")).toBe("1");
    await expect
        .poll(async () => {
            const state = await getState(page);
            return state.journeyBeat;
        })
        .toBe("beat_06_dreadpeak_cavern");
    await expect
        .poll(async () => {
            const party = await getParty(page);
            return JSON.stringify(party);
        })
        .toBe(
            JSON.stringify([
                {
                    slot: 0,
                    speciesId: "ashcat",
                    level: 8,
                    xp: 702,
                },
                {
                    slot: 1,
                    speciesId: "bramble_imp",
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
        .toBe("dreadpeak_cavern:dreadpeak_cavern");
    await captureGoldenPathCheckpoint(page, testInfo, {
        id: "17-cave-shrine-entry",
        title: "Cave shrine entry",
        expectedMapId: "dreadpeak_cavern",
        expectedHiddenTestIds: COMBAT_HUD_TEST_IDS,
        focus: [
            "Cave walls, shrine floor, torches, and blocked slopes face correctly and feel cohesive.",
            "Player entry is not embedded in cave wall collision or decorative blockers.",
        ],
    });

    const peakGymIntroTask = await beginEvent(page, "jan-suli");
    await advanceDialog(page, "Dreadpeak doesn't forgive sloppy teams.", peakGymIntroTask);
    await advanceDialog(page, "Show me why the mountain should let you pass.", peakGymIntroTask);
    await expectActionBattleReady(page, peakGymIntroTask);

    const peakGymDefeatTask = await beginDefeatEvent(page, "jan-suli");
    await advanceDialog(page, "You climbed higher than I expected.", peakGymDefeatTask);
    await advanceDialog(page, "The final road is open.", peakGymDefeatTask);

    await expect.poll(async () => getFlag(page, "badge_dreadpeak")).toBe("1");
    await expect
        .poll(async () => {
            const state = await getState(page);
            return state.journeyBeat;
        })
        .toBe("beat_07_rivergate_approach");
    await expect
        .poll(async () => {
            const party = await getParty(page);
            return JSON.stringify(party);
        })
        .toBe(
            JSON.stringify([
                {
                    slot: 0,
                    speciesId: "ashcat",
                    level: 9,
                    xp: 922,
                },
                {
                    slot: 1,
                    speciesId: "bramble_imp",
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
        .toBe("rivergate_approach:rivergate_approach:beat_07_rivergate_approach");
    await captureGoldenPathCheckpoint(page, testInfo, {
        id: "18-final-water-route-entry",
        title: "Final water route entry",
        expectedMapId: "rivergate_approach",
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
    await advanceDialog(page, "The rivergate burns with green fire. I am done hiding.", finalBossIntroTask);
    await expectActionBattleReady(page, finalBossIntroTask);
    await captureGoldenPathCheckpoint(page, testInfo, {
        id: "19-green-dragon-combat-intro",
        title: "Green dragon combat intro",
        expectedMapId: "rivergate_approach",
        expectedVisibleTestIds: ["lead-movebar"],
        focus: [
            "Green dragon set-piece reads as endgame scale and does not reuse mid-game visual language accidentally.",
            "Combat HUD, target reticle, and final-route map do not obscure each other.",
        ],
    });

    const finalBossDefeatTask = await beginDefeatEvent(page, "green-dragon");
    await advanceDialog(page, "The storm is finally quiet.", finalBossDefeatTask);
    await expectDialog(page, /Rivers Reckoning\s+thanks for playing\./, finalBossDefeatTask);
    await captureGoldenPathCheckpoint(page, testInfo, {
        id: "20-ending-credits-title",
        title: "Ending credits title page",
        expectedMapId: "rivergate_approach",
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
        expectedMapId: "rivergate_approach",
        expectedHiddenTestIds: COMBAT_HUD_TEST_IDS,
        focus: [
            "Credits page two remains readable and consistently aligned after paging.",
            "No map, dialog, or combat element leaks into the foreground unexpectedly.",
        ],
    });
    await closeDialog(page);
    await expectDialog(
        page,
        /art \/ tiles \/ creatures\s+Fan-tasy asset family\s+special thanks\s+Rivers/,
        finalBossDefeatTask,
    );
    await captureGoldenPathCheckpoint(page, testInfo, {
        id: "22-ending-credits-art",
        title: "Ending credits art and thanks page",
        expectedMapId: "rivergate_approach",
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
