import { expect, test, type Page } from '@playwright/test';

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

function titleEntry(page: Page, index: number) {
    return page.locator('.rpg-ui-title-screen-menu .rpg-ui-menu-item').nth(index);
}

function dialogChoice(page: Page, index: number) {
    return page.locator(`.rpg-ui-dialog-choice[data-choice-index="${index}"]`);
}

async function beginEvent(page: Page, eventId: string, trigger: 'action' | 'touch' = 'action'): Promise<string> {
    return page.evaluate(({ id, mode }) => {
        return window.__POKI__!.testing.beginEvent(id, mode);
    }, { id: eventId, mode: trigger });
}

async function triggerEvent(page: Page, eventId: string, trigger: 'action' | 'touch' = 'action'): Promise<void> {
    await page.evaluate(({ id, mode }) => {
        return window.__POKI__!.testing.triggerEvent(id, mode);
    }, { id: eventId, mode: trigger });
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
    return page.evaluate(({ shape, values }) => {
        return window.__POKI__!.testing.beginShape(shape, { randomValues: values });
    }, { shape: target, values: randomValues });
}

async function advanceDialog(page: Page, expectedText: string | RegExp, taskId?: string): Promise<void> {
    const content = page.locator('.rpg-ui-dialog-content');
    if (typeof expectedText === 'string' && taskId) {
        await expect.poll(async () => {
            const status = await getTaskStatus(page, taskId);
            if (status?.error) {
                return `ERROR: ${status.error}`;
            }
            return (await content.textContent()) ?? '';
        }).toBe(expectedText);
    } else {
        await expect(content).toHaveText(expectedText);
    }
    await page.evaluate(() => window.__POKI__!.testing.closeGui('rpg-dialog'));
}

test('browser golden path covers starter ceremony through the clear credits', async ({ page }) => {
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];

    page.on('pageerror', (error) => {
        pageErrors.push(error.message);
    });
    page.on('console', (message) => {
        if (message.type() === 'error') {
            consoleErrors.push(message.text());
        }
    });

    await page.goto('/');
    await waitForReady(page);

    await page.evaluate(() => window.__POKI__!.testing.resetPersistence({ includeSaves: true }));
    await page.reload();
    await waitForReady(page);

    await expect(page.locator('.rpg-ui-title-screen-title')).toContainText('poki soweli');
    await expect(titleEntry(page, 0)).toContainText('open sin');
    await titleEntry(page, 0).click();

    await expect.poll(async () => {
        const state = await getState(page);
        return state.saves[0]?.map ?? null;
    }).toBe('ma_tomo_lili');

    const gatedWarpTask = await beginEvent(page, 'warp_east', 'touch');
    await advanceDialog(page, 'hello', gatedWarpTask);
    await advanceDialog(page, 'kili sin li pona tawa sijelo.', gatedWarpTask);
    await advanceDialog(page, 'kule seme li pona tawa sina?', gatedWarpTask);

    await expect.poll(async () => {
        const state = await getState(page);
        return `${state.currentMapId}:${state.serverMapId}:${state.starterChosen}`;
    }).toBe('ma_tomo_lili:ma_tomo_lili:null');

    const starterTask = await beginEvent(page, 'jan-sewi');
    await advanceDialog(page, 'hello', starterTask);
    await advanceDialog(page, 'kili sin li pona tawa sijelo.', starterTask);
    await advanceDialog(page, 'kule seme li pona tawa sina?', starterTask);

    await expect(dialogChoice(page, 0)).toContainText('kon moli');
    await expect(dialogChoice(page, 1)).toContainText('telo jaki');
    await expect(dialogChoice(page, 2)).toContainText('jan ike lili');
    await dialogChoice(page, 0).click();

    await expect.poll(async () => {
        const state = await getState(page);
        return state.starterChosen;
    }).toBe('kon_moli');
    await expect.poll(async () => getFlag(page, 'starter_chosen')).toBe('1');
    await expect.poll(async () => getInventoryCount(page, 'poki_lili')).toBe(3);
    await expect.poll(async () => {
        const party = await getParty(page);
        return JSON.stringify(party);
    }).toBe(JSON.stringify([
        {
            slot: 0,
            speciesId: 'kon_moli',
            level: 5,
            xp: 0,
        },
    ]));

    const unlockedWarpTask = await beginEvent(page, 'warp_east', 'touch');
    await expect(page.getByTestId('warp-loading')).toContainText('nasin wan');
    await expect(page.getByTestId('warp-loading')).toHaveAttribute('data-phase', /enter|settle/);
    await expect.poll(async () => {
        const status = await getTaskStatus(page, unlockedWarpTask);
        return status?.done ?? false;
    }).toBe(true);
    await expect(page.getByTestId('warp-loading')).toBeHidden();
    await expect.poll(async () => {
        const state = await getState(page);
        return `${state.currentMapId}:${state.serverMapId}`;
    }).toBe('nasin_wan:nasin_wan');

    const encounterTask = await beginShape(page, {
            name: 'encounter_0',
            properties: {
                type: 'Encounter',
                species: '{"jan_ike_lili":25,"jan_utala_lili":20,"soweli_musi":20,"soweli_kili":15,"soweli_jaki":10,"waso_pimeja":10}',
                level_min: 3,
                level_max: 5,
            },
    }, Array.from({ length: 16 }, () => 0));
    await advanceDialog(page, 'sina soweli.', encounterTask);

    await expect(page.getByTestId('wild-battle')).toBeVisible();
    await expect(page.getByTestId('wild-battle-lead')).toContainText('kon moli');
    await expect(page.getByTestId('wild-battle-target')).toContainText('jan ike lili');
    await expect(dialogChoice(page, 0)).toContainText('utala');
    await expect(dialogChoice(page, 1)).toContainText('poki');
    await expect(dialogChoice(page, 2)).toContainText('ijo');
    await expect(dialogChoice(page, 3)).toContainText('tawa');
    await dialogChoice(page, 0).click();

    await expect(page.getByTestId('wild-battle-damage')).toContainText(/-\d+ HP/);
    await advanceDialog(page, /utala: -\d+ HP/, encounterTask);
    await expect(dialogChoice(page, 1)).toContainText('poki');
    await dialogChoice(page, 1).click();

    await expect(page.getByTestId('wild-battle-capture')).toContainText('poki li tawa');
    await expect(page.getByTestId('wild-battle-capture')).toContainText('poki li awen');
    await advanceDialog(page, 'a. pona.', encounterTask);
    await expect.poll(async () => {
        const status = await getTaskStatus(page, encounterTask);
        return status?.done ?? false;
    }).toBe(true);
    await expect(page.getByTestId('wild-battle')).toBeHidden();

    await expect.poll(async () => {
        const party = await getParty(page);
        return JSON.stringify(party);
    }).toBe(JSON.stringify([
        {
            slot: 0,
            speciesId: 'kon_moli',
            level: 5,
            xp: 152,
        },
        {
            slot: 1,
            speciesId: 'jan_ike_lili',
            level: 3,
            xp: 0,
        },
    ]));
    await expect.poll(async () => JSON.stringify(await getLatestEncounter(page))).toBe(JSON.stringify({
        speciesId: 'jan_ike_lili',
        mapId: 'nasin_wan',
        outcome: 'caught',
    }));
    await expect.poll(async () => getInventoryCount(page, 'poki_lili')).toBe(2);
    await expect.poll(async () => {
        const state = await getState(page);
        return state.journeyBeat;
    }).toBe('beat_01_ma_tomo_lili');

    const rivalIntroTask = await beginEvent(page, 'jan-ike');
    await advanceDialog(page, 'mi mute o lukin!', rivalIntroTask);
    await advanceDialog(page, 'mi ala.', rivalIntroTask);
    await expect.poll(async () => {
        const state = await getState(page);
        return state.serverGraphic;
    }).toBe('species_kon_moli');

    const rivalDefeatTask = await beginDefeatEvent(page, 'jan-ike');
    await advanceDialog(page, 'sina pini pona.', rivalDefeatTask);
    await advanceDialog(page, 'mi mute o tawa!', rivalDefeatTask);

    await expect.poll(async () => getFlag(page, 'jan_ike_defeated')).toBe('1');
    await expect.poll(async () => {
        const state = await getState(page);
        return state.journeyBeat;
    }).toBe('beat_03_nena_sewi');
    await expect.poll(async () => {
        const state = await getState(page);
        return state.serverGraphic;
    }).toBe('hero');

    await triggerEvent(page, 'warp_east', 'touch');
    await expect.poll(async () => {
        const state = await getState(page);
        return `${state.currentMapId}:${state.serverMapId}`;
    }).toBe('nena_sewi:nena_sewi');

    const gymIntroTask = await beginEvent(page, 'jan-wawa');
    await advanceDialog(page, 'mi wawa mute!', gymIntroTask);
    await advanceDialog(page, 'mi mute o lukin!', gymIntroTask);

    const gymDefeatTask = await beginDefeatEvent(page, 'jan-wawa');
    await advanceDialog(page, 'sina pini pona.', gymDefeatTask);
    await advanceDialog(page, 'lukin la sina pilin pona...', gymDefeatTask);

    await expect.poll(async () => getFlag(page, 'badge_sewi')).toBe('1');
    await expect.poll(async () => {
        const state = await getState(page);
        return state.journeyBeat;
    }).toBe('beat_04_ma_telo');
    await expect.poll(async () => {
        const party = await getParty(page);
        return JSON.stringify(party);
    }).toBe(JSON.stringify([
        {
            slot: 0,
            speciesId: 'kon_moli',
            level: 7,
            xp: 372,
        },
        {
            slot: 1,
            speciesId: 'jan_ike_lili',
            level: 3,
            xp: 0,
        },
    ]));

    await triggerEvent(page, 'warp_north', 'touch');
    await expect.poll(async () => {
        const state = await getState(page);
        return `${state.currentMapId}:${state.serverMapId}`;
    }).toBe('ma_telo:ma_telo');
    await expect.poll(async () => getInventoryCount(page, 'ma')).toBe(10);

    const shopTask = await beginEvent(page, 'jan-moku');
    await advanceDialog(page, 'kili sin li pona tawa sijelo.', shopTask);

    await expect(dialogChoice(page, 0)).toContainText('poki lili ×1');
    await expect(dialogChoice(page, 1)).toContainText('kili ×1');
    await dialogChoice(page, 0).click();
    await advanceDialog(page, /poki lili \+1\s+ma 8/, shopTask);

    await expect(dialogChoice(page, 1)).toContainText('kili ×1');
    await dialogChoice(page, 1).click();
    await advanceDialog(page, /kili \+1\s+ma 7/, shopTask);

    await expect(dialogChoice(page, 2)).toContainText('telo pona ×1');
    await expect(dialogChoice(page, 3)).toContainText('poki wawa ×1');
    await expect(dialogChoice(page, 4)).toContainText('tawa');
    await dialogChoice(page, 4).click();
    await expect.poll(async () => {
        const status = await getTaskStatus(page, shopTask);
        return status?.done ?? false;
    }).toBe(true);
    await expect.poll(async () => getInventoryCount(page, 'ma')).toBe(7);
    await expect.poll(async () => getInventoryCount(page, 'poki_lili')).toBe(3);
    await expect.poll(async () => getInventoryCount(page, 'kili')).toBe(2);

    const lakeGymIntroTask = await beginEvent(page, 'jan-telo');
    await advanceDialog(page, 'mi mute o lukin!', lakeGymIntroTask);
    await advanceDialog(page, 'mi wawa mute!', lakeGymIntroTask);

    const lakeGymDefeatTask = await beginDefeatEvent(page, 'jan-telo');
    await advanceDialog(page, 'sina pini pona.', lakeGymDefeatTask);
    await advanceDialog(page, 'mi mute o tawa!', lakeGymDefeatTask);

    await expect.poll(async () => getFlag(page, 'badge_telo')).toBe('1');
    await expect.poll(async () => {
        const state = await getState(page);
        return state.journeyBeat;
    }).toBe('beat_05_ma_lete');
    await expect.poll(async () => {
        const party = await getParty(page);
        return JSON.stringify(party);
    }).toBe(JSON.stringify([
        {
            slot: 0,
            speciesId: 'kon_moli',
            level: 8,
            xp: 522,
        },
        {
            slot: 1,
            speciesId: 'jan_ike_lili',
            level: 3,
            xp: 0,
        },
    ]));

    await triggerEvent(page, 'warp_north', 'touch');
    await expect.poll(async () => {
        const state = await getState(page);
        return `${state.currentMapId}:${state.serverMapId}`;
    }).toBe('ma_lete:ma_lete');

    const coldGymIntroTask = await beginEvent(page, 'jan-lete');
    await advanceDialog(page, 'mi mute o lukin!', coldGymIntroTask);
    await advanceDialog(page, 'mi wawa mute!', coldGymIntroTask);

    const coldGymDefeatTask = await beginDefeatEvent(page, 'jan-lete');
    await advanceDialog(page, 'sina pini pona.', coldGymDefeatTask);
    await advanceDialog(page, 'mi mute o tawa!', coldGymDefeatTask);

    await expect.poll(async () => getFlag(page, 'badge_lete')).toBe('1');
    await expect.poll(async () => {
        const state = await getState(page);
        return state.journeyBeat;
    }).toBe('beat_06_nena_suli');
    await expect.poll(async () => {
        const party = await getParty(page);
        return JSON.stringify(party);
    }).toBe(JSON.stringify([
        {
            slot: 0,
            speciesId: 'kon_moli',
            level: 8,
            xp: 702,
        },
        {
            slot: 1,
            speciesId: 'jan_ike_lili',
            level: 3,
            xp: 0,
        },
    ]));

    await triggerEvent(page, 'warp_north', 'touch');
    await expect.poll(async () => {
        const state = await getState(page);
        return `${state.currentMapId}:${state.serverMapId}`;
    }).toBe('nena_suli:nena_suli');

    const peakGymIntroTask = await beginEvent(page, 'jan-suli');
    await advanceDialog(page, 'mi mute o lukin!', peakGymIntroTask);
    await advanceDialog(page, 'mi wawa mute!', peakGymIntroTask);

    const peakGymDefeatTask = await beginDefeatEvent(page, 'jan-suli');
    await advanceDialog(page, 'lukin la sina pilin pona...', peakGymDefeatTask);
    await advanceDialog(page, 'mi mute o tawa!', peakGymDefeatTask);

    await expect.poll(async () => getFlag(page, 'badge_suli')).toBe('1');
    await expect.poll(async () => {
        const state = await getState(page);
        return state.journeyBeat;
    }).toBe('beat_07_nasin_pi_telo');
    await expect.poll(async () => {
        const party = await getParty(page);
        return JSON.stringify(party);
    }).toBe(JSON.stringify([
        {
            slot: 0,
            speciesId: 'kon_moli',
            level: 9,
            xp: 922,
        },
        {
            slot: 1,
            speciesId: 'jan_ike_lili',
            level: 3,
            xp: 0,
        },
    ]));

    await triggerEvent(page, 'warp_north', 'touch');
    await expect.poll(async () => {
        const state = await getState(page);
        return `${state.currentMapId}:${state.serverMapId}:${state.journeyBeat}`;
    }).toBe('nasin_pi_telo:nasin_pi_telo:beat_07_nasin_pi_telo');

    const finalBossIntroTask = await beginShape(page, {
        name: 'final_boss_trigger',
        properties: {
            target_event: 'green_dragon',
            required_flag: 'badges_all_four',
        },
    });
    await advanceDialog(page, 'mi wawa mute!', finalBossIntroTask);

    const finalBossDefeatTask = await beginDefeatEvent(page, 'green-dragon');
    await advanceDialog(page, 'a. pona.', finalBossDefeatTask);
    await advanceDialog(page, /poki soweli\s+thanks for playing\./, finalBossDefeatTask);
    await advanceDialog(
        page,
        /game \/ code \/ maps\s+project team\s+engine\s+RPGJS \/ CanvasEngine \/ Pixi/,
        finalBossDefeatTask,
    );
    await advanceDialog(
        page,
        /art \/ tiles \/ creatures\s+Fan-tasy asset family\s+language corpus\s+Tatoeba/,
        finalBossDefeatTask,
    );

    await expect.poll(async () => getFlag(page, 'green_dragon_defeated')).toBe('1');
    await expect.poll(async () => getFlag(page, 'game_cleared')).toBe('1');
    await expect.poll(async () => {
        const state = await getState(page);
        return state.journeyBeat;
    }).toBe('ending');
    await expect.poll(async () => {
        const status = await getTaskStatus(page, finalBossDefeatTask);
        return status?.done ?? false;
    }).toBe(true);
    await expect.poll(async () => {
        const status = await getTaskStatus(page, finalBossDefeatTask);
        return status?.error ?? null;
    }).toBeNull();

    await page.waitForTimeout(250);
    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
});
